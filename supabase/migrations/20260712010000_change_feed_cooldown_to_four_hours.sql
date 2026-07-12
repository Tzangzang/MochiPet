begin;

create or replace function public.pet_feed_cooldown()
returns interval
language sql
immutable
set search_path = ''
as $$
  select interval '4 hours';
$$;

create or replace function public.pet_derived_state(
  p_last_fed_at timestamptz,
  p_status text,
  p_died_at timestamptz,
  p_now timestamptz
)
returns table (
  hunger_state text,
  can_feed boolean,
  next_feed_at timestamptz,
  next_state_at timestamptz
)
language sql
stable
set search_path = ''
as $$
  select
    case
      when p_status = 'dead' or p_died_at is not null then 'dead'
      else public.pet_hunger_state(p_last_fed_at, p_now)
    end,
    (
      p_status = 'active'
      and p_died_at is null
      and public.pet_hunger_state(p_last_fed_at, p_now) <> 'dead'
      and p_now >= p_last_fed_at + public.pet_feed_cooldown()
    ),
    p_last_fed_at + public.pet_feed_cooldown(),
    case
      when p_status = 'dead'
        or p_died_at is not null
        or public.pet_hunger_state(p_last_fed_at, p_now) = 'dead' then null
      when p_now < p_last_fed_at + interval '24 hours' then p_last_fed_at + interval '24 hours'
      when p_now < p_last_fed_at + interval '48 hours' then p_last_fed_at + interval '48 hours'
      when p_now < p_last_fed_at + interval '72 hours' then p_last_fed_at + interval '72 hours'
      when p_now < p_last_fed_at + interval '96 hours' then p_last_fed_at + interval '96 hours'
      else p_last_fed_at + interval '120 hours'
    end;
$$;

create or replace function public.feed_pet(
  p_pet_id uuid,
  p_idempotency_key text
)
returns table (
  pet_id uuid,
  status text,
  hunger_state text,
  last_fed_at timestamptz,
  died_at timestamptz,
  state_version bigint,
  server_now timestamptz,
  can_feed boolean,
  next_feed_at timestamptz,
  next_state_at timestamptz,
  outcome text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_key text := btrim(coalesce(p_idempotency_key, ''));
  v_req public.pet_core_requests;
  v_pet public.pets;
  v_now timestamptz;
  v_outcome text;
begin
  if v_user is null then
    raise exception 'authentication required' using errcode = 'insufficient_privilege';
  end if;
  if p_pet_id is null then
    raise exception 'invalid pet id' using errcode = 'check_violation';
  end if;
  if char_length(v_key) < 1 or char_length(v_key) > 200 then
    raise exception 'invalid idempotency key' using errcode = 'check_violation';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user::text || ':feed_pet:' || v_key, 0));

  select r.* into v_req
  from public.pet_core_requests r
  where r.user_id = v_user and r.operation = 'feed_pet' and r.idempotency_key = v_key;
  if found then
    if v_req.resource_id is distinct from p_pet_id then
      raise exception 'idempotency key already used for a different pet' using errcode = 'check_violation';
    end if;
    return query
    select
      (v_req.result ->> 'pet_id')::uuid,
      v_req.result ->> 'status',
      v_req.result ->> 'hunger_state',
      (v_req.result ->> 'last_fed_at')::timestamptz,
      (v_req.result ->> 'died_at')::timestamptz,
      (v_req.result ->> 'state_version')::bigint,
      (v_req.result ->> 'server_now')::timestamptz,
      (v_req.result ->> 'can_feed')::boolean,
      (v_req.result ->> 'next_feed_at')::timestamptz,
      (v_req.result ->> 'next_state_at')::timestamptz,
      v_req.result ->> 'outcome';
    return;
  end if;

  select p.* into v_pet
  from public.pets p
  where p.id = p_pet_id
  for update;
  if not found then
    raise exception 'pet not found' using errcode = 'no_data_found';
  end if;

  if not public.is_active_pet_caregiver(p_pet_id, v_user) then
    raise exception 'not a caregiver of this pet' using errcode = 'insufficient_privilege';
  end if;

  select r.* into v_req
  from public.pet_core_requests r
  where r.user_id = v_user and r.operation = 'feed_pet' and r.idempotency_key = v_key;
  if found then
    if v_req.resource_id is distinct from p_pet_id then
      raise exception 'idempotency key already used for a different pet' using errcode = 'check_violation';
    end if;
    return query
    select
      (v_req.result ->> 'pet_id')::uuid,
      v_req.result ->> 'status',
      v_req.result ->> 'hunger_state',
      (v_req.result ->> 'last_fed_at')::timestamptz,
      (v_req.result ->> 'died_at')::timestamptz,
      (v_req.result ->> 'state_version')::bigint,
      (v_req.result ->> 'server_now')::timestamptz,
      (v_req.result ->> 'can_feed')::boolean,
      (v_req.result ->> 'next_feed_at')::timestamptz,
      (v_req.result ->> 'next_state_at')::timestamptz,
      v_req.result ->> 'outcome';
    return;
  end if;

  v_pet := public.resolve_pet_life(p_pet_id);
  v_now := now();

  if v_pet.status = 'dead' or v_pet.died_at is not null then
    v_outcome := 'dead';
  elsif v_now < v_pet.last_fed_at + public.pet_feed_cooldown() then
    v_outcome := 'cooldown';
  else
    update public.pets p
    set last_fed_at = v_now,
        updated_at = v_now,
        state_version = v_pet.state_version + 1
    where p.id = p_pet_id
    returning p.* into v_pet;

    insert into public.pet_feeding_logs (
      pet_id, actor_user_id, food_key, idempotency_key,
      previous_last_fed_at, fed_at, resulting_life_status
    )
    values (
      p_pet_id, v_user, 'basic_meal', v_key,
      v_pet.last_fed_at, v_now, 'normal'
    );

    v_outcome := 'fed';

    insert into public.pet_core_requests (user_id, operation, idempotency_key, resource_id, result)
    select
      v_user, 'feed_pet', v_key, p_pet_id,
      jsonb_build_object(
        'pet_id', v_pet.id,
        'status', v_pet.status,
        'hunger_state', d.hunger_state,
        'last_fed_at', v_pet.last_fed_at,
        'died_at', v_pet.died_at,
        'state_version', v_pet.state_version,
        'server_now', v_now,
        'can_feed', d.can_feed,
        'next_feed_at', d.next_feed_at,
        'next_state_at', d.next_state_at,
        'outcome', 'fed'
      )
    from public.pet_derived_state(v_pet.last_fed_at, v_pet.status, v_pet.died_at, v_now) d;
  end if;

  return query
  select
    v_pet.id,
    v_pet.status,
    d.hunger_state,
    v_pet.last_fed_at,
    v_pet.died_at,
    v_pet.state_version,
    v_now,
    d.can_feed,
    d.next_feed_at,
    d.next_state_at,
    v_outcome
  from public.pet_derived_state(v_pet.last_fed_at, v_pet.status, v_pet.died_at, v_now) d;
end;
$$;

revoke execute on function public.pet_feed_cooldown() from public, anon;
revoke execute on function public.pet_derived_state(timestamptz, text, timestamptz, timestamptz) from public, anon;
revoke execute on function public.feed_pet(uuid, text) from public, anon;

grant execute on function public.pet_feed_cooldown() to authenticated;
grant execute on function public.pet_derived_state(timestamptz, text, timestamptz, timestamptz) to authenticated;
grant execute on function public.feed_pet(uuid, text) to authenticated;

commit;
