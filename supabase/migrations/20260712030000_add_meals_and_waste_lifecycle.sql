begin;

create or replace function public.pet_tz_is_valid(p_tz text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (select 1 from pg_timezone_names where name = p_tz);
$$;

create or replace function public.pet_waste_decay_hours(
  p_pet_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
returns table (waste_hours numeric, overflow_hours numeric)
language sql
stable
set search_path = ''
as $$
  with w as (
    select available_at as a, coalesce(cleaned_at, p_to) as c
    from public.pet_waste
    where pet_id = p_pet_id
      and available_at < p_to
      and coalesce(cleaned_at, p_to) > p_from
  ),
  clipped as (
    select greatest(a, p_from) as lo, least(c, p_to) as hi from w
  ),
  perwaste as (
    select coalesce(sum(greatest(0, extract(epoch from (hi - lo)) / 3600.0)), 0) as wh
    from clipped where hi > lo
  ),
  bounds as (
    select p_from as b
    union select p_to
    union select greatest(a, p_from) from w
    union select least(c, p_to) from w
  ),
  ob as (select b from bounds where b >= p_from and b <= p_to),
  ordered as (select b, lead(b) over (order by b) as nb from ob),
  segs as (select b, nb from ordered where nb is not null and nb > b),
  counted as (
    select b, nb,
      (select count(*) from public.pet_waste x
        where x.pet_id = p_pet_id
          and x.available_at <= b
          and coalesce(x.cleaned_at, p_to) > b) as cnt
    from segs
  ),
  overflow as (
    select coalesce(sum(case when cnt >= 5 then extract(epoch from (nb - b)) / 3600.0 else 0 end), 0) as oh
    from counted
  )
  select (select wh from perwaste), (select oh from overflow);
$$;

create or replace function public.resolve_pet_lifecycle(p_pet_id uuid)
returns public.pets
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := now();
  v_pet public.pets;
  v_tz text;
  v_pending text;
  v_today date;
  v_grace date;
  v_cursor date;
  v_meal smallint;
  v_missed smallint;
  v_is_grace boolean;
  v_inserted boolean;
  v_health integer;
  v_hygiene integer;
  v_meal_today smallint;
  v_current date;
  v_wh numeric;
  v_oh numeric;
  v_version bigint;
  v_status text;
  v_died timestamptz;
begin
  select p.* into v_pet from public.pets p where p.id = p_pet_id for update;
  if not found then
    return null;
  end if;

  if v_pet.status = 'dead' then
    return v_pet;
  end if;

  v_tz := v_pet.game_tz;
  v_pending := v_pet.pending_game_tz;
  v_health := v_pet.health;
  v_hygiene := v_pet.hygiene;
  v_meal_today := v_pet.meal_count_today;
  v_current := v_pet.current_game_date;
  v_version := v_pet.state_version;
  v_status := v_pet.status;
  v_died := v_pet.died_at;

  if v_tz is not null then
    if v_current is null then
      v_current := (v_now at time zone v_tz)::date;
    end if;
    v_today := (v_now at time zone v_tz)::date;
    if v_today > v_current then
      if v_pending is not null then
        v_tz := v_pending;
        v_pending := null;
        v_today := (v_now at time zone v_tz)::date;
      end if;
      v_grace := (v_pet.lifecycle_started_at at time zone v_tz)::date;
      v_cursor := v_current;
      while v_cursor < v_today loop
        if v_cursor = v_current then
          v_meal := v_meal_today;
        else
          v_meal := 0;
        end if;
        v_is_grace := (v_cursor = v_grace);
        if v_is_grace then
          v_missed := 0;
        else
          v_missed := greatest(0, 3 - v_meal);
        end if;
        insert into public.pet_daily_states (
          pet_id, game_date, game_tz, meal_count, missed_meals,
          sleep_seconds, sleep_requirement_met, is_grace_day, finalized_at
        )
        values (
          p_pet_id, v_cursor, v_tz, v_meal, v_missed,
          0, false, v_is_grace, v_now
        )
        on conflict (pet_id, game_date) do nothing;
        v_inserted := found;
        if v_inserted and not v_is_grace and v_missed > 0 then
          v_health := greatest(0, v_health - v_missed * 8);
        end if;
        v_cursor := v_cursor + 1;
      end loop;
      v_current := v_today;
      v_meal_today := 0;
    end if;
  end if;

  select waste_hours, overflow_hours into v_wh, v_oh
  from public.pet_waste_decay_hours(p_pet_id, v_pet.stats_resolved_at, v_now);
  v_hygiene := greatest(0, least(100, v_hygiene - round(4 * v_wh)));
  v_health := greatest(0, least(100, v_health - round(2 * v_wh + 6 * v_oh)));

  if v_status = 'active'
     and v_died is null
     and v_now - v_pet.last_fed_at >= interval '120 hours' then
    v_status := 'dead';
    v_died := v_pet.last_fed_at + interval '120 hours';
    v_version := v_version + 1;
  end if;

  update public.pets p
  set game_tz = v_tz,
      pending_game_tz = v_pending,
      health = v_health,
      hygiene = v_hygiene,
      meal_count_today = v_meal_today,
      current_game_date = v_current,
      status = v_status,
      died_at = v_died,
      state_version = v_version,
      stats_resolved_at = v_now,
      updated_at = v_now
  where p.id = p_pet_id
  returning p.* into v_pet;

  return v_pet;
end;
$$;

create or replace function public.set_pet_game_timezone(
  p_pet_id uuid,
  p_game_tz text,
  p_idempotency_key text
)
returns public.pets
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_key text := btrim(coalesce(p_idempotency_key, ''));
  v_tz text := btrim(coalesce(p_game_tz, ''));
  v_pet public.pets;
  v_is_owner boolean;
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
  if not public.pet_tz_is_valid(v_tz) then
    raise exception 'invalid timezone' using errcode = 'check_violation';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user::text || ':set_game_tz:' || v_key, 0));

  select p.* into v_pet from public.pets p where p.id = p_pet_id for update;
  if not found then
    raise exception 'pet not found' using errcode = 'no_data_found';
  end if;
  if not public.is_active_pet_caregiver(p_pet_id, v_user) then
    raise exception 'not a caregiver of this pet' using errcode = 'insufficient_privilege';
  end if;

  select exists (
    select 1 from public.pet_caregivers c
    where c.pet_id = p_pet_id and c.user_id = v_user and c.status = 'active' and c.role = 'owner'
  ) into v_is_owner;
  if not v_is_owner then
    raise exception 'only owner can set game timezone' using errcode = 'insufficient_privilege';
  end if;

  v_pet := public.resolve_pet_lifecycle(p_pet_id);
  if v_pet.status = 'dead' then
    return v_pet;
  end if;

  if v_pet.game_tz is null then
    update public.pets p
    set game_tz = v_tz,
        current_game_date = (now() at time zone v_tz)::date,
        updated_at = now()
    where p.id = p_pet_id
    returning p.* into v_pet;
  elsif v_pet.game_tz <> v_tz then
    update public.pets p
    set pending_game_tz = v_tz,
        updated_at = now()
    where p.id = p_pet_id
    returning p.* into v_pet;
  end if;

  return v_pet;
end;
$$;

drop function if exists public.feed_pet(uuid, text);

create function public.feed_pet(
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
  outcome text,
  meal_count_today smallint,
  meals_required smallint,
  waste_available_at timestamptz
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
  v_log_id uuid;
  v_waste_at timestamptz;
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
      (v_req.result ->> 'pet_id')::uuid, v_req.result ->> 'status', v_req.result ->> 'hunger_state',
      (v_req.result ->> 'last_fed_at')::timestamptz, (v_req.result ->> 'died_at')::timestamptz,
      (v_req.result ->> 'state_version')::bigint, (v_req.result ->> 'server_now')::timestamptz,
      (v_req.result ->> 'can_feed')::boolean, (v_req.result ->> 'next_feed_at')::timestamptz,
      (v_req.result ->> 'next_state_at')::timestamptz, v_req.result ->> 'outcome',
      (v_req.result ->> 'meal_count_today')::smallint, (v_req.result ->> 'meals_required')::smallint,
      (v_req.result ->> 'waste_available_at')::timestamptz;
    return;
  end if;

  select p.* into v_pet from public.pets p where p.id = p_pet_id for update;
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
      (v_req.result ->> 'pet_id')::uuid, v_req.result ->> 'status', v_req.result ->> 'hunger_state',
      (v_req.result ->> 'last_fed_at')::timestamptz, (v_req.result ->> 'died_at')::timestamptz,
      (v_req.result ->> 'state_version')::bigint, (v_req.result ->> 'server_now')::timestamptz,
      (v_req.result ->> 'can_feed')::boolean, (v_req.result ->> 'next_feed_at')::timestamptz,
      (v_req.result ->> 'next_state_at')::timestamptz, v_req.result ->> 'outcome',
      (v_req.result ->> 'meal_count_today')::smallint, (v_req.result ->> 'meals_required')::smallint,
      (v_req.result ->> 'waste_available_at')::timestamptz;
    return;
  end if;

  v_pet := public.resolve_pet_lifecycle(p_pet_id);
  v_now := now();

  if v_pet.status = 'dead' or v_pet.died_at is not null then
    v_outcome := 'dead';
  elsif v_pet.is_refusing_food then
    v_outcome := 'refusing_food';
  elsif v_pet.game_tz is null then
    v_outcome := 'needs_timezone';
  elsif v_now < v_pet.last_fed_at + public.pet_feed_cooldown() then
    v_outcome := 'cooldown';
  else
    insert into public.pet_feeding_logs (
      pet_id, actor_user_id, food_key, idempotency_key,
      previous_last_fed_at, fed_at, resulting_life_status
    )
    values (
      p_pet_id, v_user, 'basic_meal', v_key,
      v_pet.last_fed_at, v_now, 'normal'
    )
    returning id into v_log_id;

    v_waste_at := v_now + interval '30 minutes';
    insert into public.pet_waste (pet_id, source_feeding_log_id, available_at, pos_seed)
    values (p_pet_id, v_log_id, v_waste_at, floor(random() * 32768)::smallint);

    update public.pets p
    set last_fed_at = v_now,
        meal_count_today = least(3, p.meal_count_today + 1),
        updated_at = v_now,
        state_version = p.state_version + 1
    where p.id = p_pet_id
    returning p.* into v_pet;

    v_outcome := 'fed';

    insert into public.pet_core_requests (user_id, operation, idempotency_key, resource_id, result)
    select
      v_user, 'feed_pet', v_key, p_pet_id,
      jsonb_build_object(
        'pet_id', v_pet.id, 'status', v_pet.status, 'hunger_state', d.hunger_state,
        'last_fed_at', v_pet.last_fed_at, 'died_at', v_pet.died_at, 'state_version', v_pet.state_version,
        'server_now', v_now, 'can_feed', d.can_feed, 'next_feed_at', d.next_feed_at,
        'next_state_at', d.next_state_at, 'outcome', 'fed',
        'meal_count_today', v_pet.meal_count_today, 'meals_required', 3,
        'waste_available_at', v_waste_at
      )
    from public.pet_derived_state(v_pet.last_fed_at, v_pet.status, v_pet.died_at, v_now) d;
  end if;

  return query
  select
    v_pet.id, v_pet.status, d.hunger_state, v_pet.last_fed_at, v_pet.died_at, v_pet.state_version,
    v_now, d.can_feed, d.next_feed_at, d.next_state_at, v_outcome,
    v_pet.meal_count_today, 3::smallint,
    case when v_outcome = 'fed' then v_waste_at else null end
  from public.pet_derived_state(v_pet.last_fed_at, v_pet.status, v_pet.died_at, v_now) d;
end;
$$;

create or replace function public.clean_pet_waste(
  p_pet_id uuid,
  p_waste_id uuid,
  p_idempotency_key text
)
returns table (
  waste_id uuid,
  outcome text,
  hygiene smallint,
  state_version bigint,
  server_now timestamptz
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
  v_waste public.pet_waste;
  v_now timestamptz;
  v_outcome text;
begin
  if v_user is null then
    raise exception 'authentication required' using errcode = 'insufficient_privilege';
  end if;
  if p_pet_id is null or p_waste_id is null then
    raise exception 'invalid input' using errcode = 'check_violation';
  end if;
  if char_length(v_key) < 1 or char_length(v_key) > 200 then
    raise exception 'invalid idempotency key' using errcode = 'check_violation';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user::text || ':clean_pet_waste:' || v_key, 0));

  select r.* into v_req
  from public.pet_core_requests r
  where r.user_id = v_user and r.operation = 'clean_pet_waste' and r.idempotency_key = v_key;
  if found then
    if v_req.resource_id is distinct from p_waste_id then
      raise exception 'idempotency key already used for a different waste' using errcode = 'check_violation';
    end if;
    return query
    select (v_req.result ->> 'waste_id')::uuid, v_req.result ->> 'outcome',
           (v_req.result ->> 'hygiene')::smallint, (v_req.result ->> 'state_version')::bigint,
           (v_req.result ->> 'server_now')::timestamptz;
    return;
  end if;

  select p.* into v_pet from public.pets p where p.id = p_pet_id for update;
  if not found then
    raise exception 'pet not found' using errcode = 'no_data_found';
  end if;
  if not public.is_active_pet_caregiver(p_pet_id, v_user) then
    raise exception 'not a caregiver of this pet' using errcode = 'insufficient_privilege';
  end if;

  v_pet := public.resolve_pet_lifecycle(p_pet_id);
  v_now := now();

  select w.* into v_waste from public.pet_waste w
  where w.id = p_waste_id and w.pet_id = p_pet_id for update;
  if not found then
    raise exception 'waste not found' using errcode = 'no_data_found';
  end if;

  if v_waste.available_at > v_now then
    raise exception 'waste not available yet' using errcode = 'check_violation';
  end if;

  if v_waste.cleaned_at is not null then
    v_outcome := 'already_cleaned';
  else
    update public.pet_waste w
    set cleaned_at = v_now, cleaned_by = v_user
    where w.id = p_waste_id;

    update public.pets p
    set hygiene = least(100, p.hygiene + 8),
        state_version = p.state_version + 1,
        updated_at = v_now
    where p.id = p_pet_id
    returning p.* into v_pet;

    v_outcome := 'cleaned';
  end if;

  insert into public.pet_core_requests (user_id, operation, idempotency_key, resource_id, result)
  values (
    v_user, 'clean_pet_waste', v_key, p_waste_id,
    jsonb_build_object(
      'waste_id', p_waste_id, 'outcome', v_outcome,
      'hygiene', v_pet.hygiene, 'state_version', v_pet.state_version, 'server_now', v_now
    )
  );

  return query
  select p_waste_id, v_outcome, v_pet.hygiene, v_pet.state_version, v_now;
end;
$$;

create or replace function public.get_pet_room_state(
  p_pet_id uuid,
  p_client_tz text
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
  game_tz text,
  pending_game_tz text,
  current_game_date date,
  meal_count_today smallint,
  meals_required smallint,
  health smallint,
  hygiene smallint,
  is_refusing_food boolean,
  refusing_food_days smallint,
  sleep_debt_days smallint,
  is_sleeping boolean,
  current_sleep_started_at timestamptz,
  sleep_seconds_today integer,
  required_sleep_seconds integer,
  waste jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_tz text := btrim(coalesce(p_client_tz, ''));
  v_pet public.pets;
  v_now timestamptz;
  v_is_owner boolean;
begin
  if v_user is null then
    raise exception 'authentication required' using errcode = 'insufficient_privilege';
  end if;
  if p_pet_id is null then
    raise exception 'invalid pet id' using errcode = 'check_violation';
  end if;

  select p.* into v_pet from public.pets p where p.id = p_pet_id for update;
  if not found then
    raise exception 'pet not found' using errcode = 'no_data_found';
  end if;
  if not public.is_active_pet_caregiver(p_pet_id, v_user) then
    raise exception 'not a caregiver of this pet' using errcode = 'insufficient_privilege';
  end if;

  select exists (
    select 1 from public.pet_caregivers c
    where c.pet_id = p_pet_id and c.user_id = v_user and c.status = 'active' and c.role = 'owner'
  ) into v_is_owner;

  if v_is_owner and v_pet.status = 'active' and v_pet.game_tz is null and public.pet_tz_is_valid(v_tz) then
    update public.pets p
    set game_tz = v_tz,
        current_game_date = (now() at time zone v_tz)::date,
        updated_at = now()
    where p.id = p_pet_id;
  elsif v_is_owner and v_pet.status = 'active' and v_pet.game_tz is not null
        and public.pet_tz_is_valid(v_tz) and v_pet.game_tz <> v_tz then
    update public.pets p
    set pending_game_tz = v_tz,
        updated_at = now()
    where p.id = p_pet_id;
  end if;

  v_pet := public.resolve_pet_lifecycle(p_pet_id);
  v_now := now();

  return query
  select
    v_pet.id, v_pet.status, d.hunger_state, v_pet.last_fed_at, v_pet.died_at, v_pet.state_version,
    v_now, d.can_feed, d.next_feed_at, d.next_state_at,
    v_pet.game_tz, v_pet.pending_game_tz, v_pet.current_game_date,
    v_pet.meal_count_today, 3::smallint, v_pet.health, v_pet.hygiene,
    v_pet.is_refusing_food, v_pet.refusing_food_days, v_pet.sleep_debt_days,
    false, null::timestamptz, 0, 28800,
    coalesce((
      select jsonb_agg(jsonb_build_object('id', x.id, 'available_at', x.available_at, 'pos_seed', x.pos_seed)
                       order by x.available_at)
      from (
        select w.id, w.available_at, w.pos_seed
        from public.pet_waste w
        where w.pet_id = p_pet_id and w.cleaned_at is null and w.available_at <= v_now
        order by w.available_at
        limit 5
      ) x
    ), '[]'::jsonb)
  from public.pet_derived_state(v_pet.last_fed_at, v_pet.status, v_pet.died_at, v_now) d;
end;
$$;

revoke execute on function public.pet_tz_is_valid(text) from public, anon;
revoke execute on function public.pet_waste_decay_hours(uuid, timestamptz, timestamptz) from public, anon, authenticated;
revoke execute on function public.resolve_pet_lifecycle(uuid) from public, anon, authenticated;
revoke execute on function public.set_pet_game_timezone(uuid, text, text) from public, anon;
revoke execute on function public.feed_pet(uuid, text) from public, anon;
revoke execute on function public.clean_pet_waste(uuid, uuid, text) from public, anon;
revoke execute on function public.get_pet_room_state(uuid, text) from public, anon;

grant execute on function public.pet_tz_is_valid(text) to authenticated;
grant execute on function public.set_pet_game_timezone(uuid, text, text) to authenticated;
grant execute on function public.feed_pet(uuid, text) to authenticated;
grant execute on function public.clean_pet_waste(uuid, uuid, text) to authenticated;
grant execute on function public.get_pet_room_state(uuid, text) to authenticated;

commit;
