begin;

create or replace function public.pet_sleep_seconds(
  p_pet_id uuid,
  p_from timestamptz,
  p_to timestamptz,
  p_floor timestamptz
)
returns integer
language sql
stable
set search_path = ''
as $$
  select coalesce(sum(greatest(0, extract(epoch from (
      least(coalesce(s.ended_at, p_to), p_to) - greatest(s.started_at, p_from, p_floor)
    ))))::integer, 0)
  from public.pet_sleep_sessions s
  where s.pet_id = p_pet_id
    and s.started_at < p_to
    and coalesce(s.ended_at, p_to) > greatest(p_from, p_floor);
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
  v_debt integer;
  v_refusing boolean;
  v_refusing_days integer;
  v_day_start timestamptz;
  v_day_end timestamptz;
  v_sleep integer;
  v_req_met boolean;
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
  v_debt := v_pet.sleep_debt_days;
  v_refusing := v_pet.is_refusing_food;
  v_refusing_days := v_pet.refusing_food_days;

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
        v_day_start := (v_cursor::timestamp) at time zone v_tz;
        v_day_end := ((v_cursor + 1)::timestamp) at time zone v_tz;
        v_sleep := public.pet_sleep_seconds(p_pet_id, v_day_start, v_day_end, v_pet.lifecycle_started_at);
        v_req_met := v_sleep >= 28800;
        insert into public.pet_daily_states (
          pet_id, game_date, game_tz, meal_count, missed_meals,
          sleep_seconds, sleep_requirement_met, is_grace_day, finalized_at
        )
        values (
          p_pet_id, v_cursor, v_tz, v_meal, v_missed,
          v_sleep, v_req_met, v_is_grace, v_now
        )
        on conflict (pet_id, game_date) do nothing;
        v_inserted := found;
        if v_inserted and not v_is_grace then
          if v_missed > 0 then
            v_health := greatest(0, v_health - v_missed * 8);
          end if;
          if v_req_met then
            v_debt := greatest(0, v_debt - 1);
          else
            v_debt := v_debt + 1;
          end if;
          if v_debt >= 7 then
            v_refusing := true;
            v_refusing_days := v_refusing_days + 1;
          else
            v_refusing := false;
            v_refusing_days := 0;
          end if;
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

  if v_status = 'active' and v_died is null
     and v_now - v_pet.last_fed_at >= interval '120 hours' then
    v_status := 'dead';
    v_died := v_pet.last_fed_at + interval '120 hours';
    v_version := v_version + 1;
  end if;

  if v_status = 'active' and v_died is null and v_refusing_days >= 3 then
    v_status := 'dead';
    v_died := v_now;
    v_version := v_version + 1;
  end if;

  update public.pets p
  set game_tz = v_tz,
      pending_game_tz = v_pending,
      health = v_health,
      hygiene = v_hygiene,
      meal_count_today = v_meal_today,
      current_game_date = v_current,
      sleep_debt_days = v_debt,
      is_refusing_food = v_refusing,
      refusing_food_days = v_refusing_days,
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

create or replace function public.start_pet_sleep(
  p_pet_id uuid,
  p_client_tz text,
  p_idempotency_key text
)
returns table (
  outcome text,
  sleep_session_id uuid,
  is_sleeping boolean,
  current_sleep_started_at timestamptz,
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
  v_now timestamptz;
  v_session uuid;
  v_outcome text;
  v_started timestamptz;
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

  perform pg_advisory_xact_lock(hashtextextended(v_user::text || ':start_pet_sleep:' || v_key, 0));

  select r.* into v_req
  from public.pet_core_requests r
  where r.user_id = v_user and r.operation = 'start_pet_sleep' and r.idempotency_key = v_key;
  if found then
    if v_req.resource_id is distinct from p_pet_id then
      raise exception 'idempotency key already used for a different pet' using errcode = 'check_violation';
    end if;
    return query
    select v_req.result ->> 'outcome', (v_req.result ->> 'sleep_session_id')::uuid,
           (v_req.result ->> 'is_sleeping')::boolean, (v_req.result ->> 'current_sleep_started_at')::timestamptz,
           (v_req.result ->> 'state_version')::bigint, (v_req.result ->> 'server_now')::timestamptz;
    return;
  end if;

  select p.* into v_pet from public.pets p where p.id = p_pet_id for update;
  if not found then
    raise exception 'pet not found' using errcode = 'no_data_found';
  end if;
  if not public.is_active_pet_caregiver(p_pet_id, v_user) then
    raise exception 'not a caregiver of this pet' using errcode = 'insufficient_privilege';
  end if;

  if v_pet.game_tz is null and public.pet_tz_is_valid(btrim(coalesce(p_client_tz, '')))
     and exists (
       select 1 from public.pet_caregivers c
       where c.pet_id = p_pet_id and c.user_id = v_user and c.status = 'active' and c.role = 'owner'
     ) then
    update public.pets p
    set game_tz = btrim(p_client_tz),
        current_game_date = (now() at time zone btrim(p_client_tz))::date,
        updated_at = now()
    where p.id = p_pet_id;
  end if;

  v_pet := public.resolve_pet_lifecycle(p_pet_id);
  v_now := now();

  if v_pet.status = 'dead' then
    v_outcome := 'dead';
    v_session := null;
    v_started := null;
  else
    select s.id, s.started_at into v_session, v_started
    from public.pet_sleep_sessions s
    where s.pet_id = p_pet_id and s.ended_at is null
    limit 1;
    if found then
      v_outcome := 'already_sleeping';
    else
      insert into public.pet_sleep_sessions (pet_id, started_at, started_by)
      values (p_pet_id, v_now, v_user)
      returning id, started_at into v_session, v_started;

      update public.pets p set state_version = p.state_version + 1, updated_at = v_now
      where p.id = p_pet_id
      returning p.* into v_pet;

      v_outcome := 'sleeping';
    end if;
  end if;

  insert into public.pet_core_requests (user_id, operation, idempotency_key, resource_id, result)
  values (
    v_user, 'start_pet_sleep', v_key, p_pet_id,
    jsonb_build_object(
      'outcome', v_outcome, 'sleep_session_id', v_session,
      'is_sleeping', (v_outcome in ('sleeping','already_sleeping')),
      'current_sleep_started_at', v_started,
      'state_version', v_pet.state_version, 'server_now', v_now
    )
  );

  return query
  select v_outcome, v_session, (v_outcome in ('sleeping','already_sleeping')), v_started, v_pet.state_version, v_now;
end;
$$;

create or replace function public.wake_pet(
  p_pet_id uuid,
  p_client_tz text,
  p_idempotency_key text
)
returns table (
  outcome text,
  is_sleeping boolean,
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
  v_now timestamptz;
  v_session uuid;
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

  perform pg_advisory_xact_lock(hashtextextended(v_user::text || ':wake_pet:' || v_key, 0));

  select r.* into v_req
  from public.pet_core_requests r
  where r.user_id = v_user and r.operation = 'wake_pet' and r.idempotency_key = v_key;
  if found then
    if v_req.resource_id is distinct from p_pet_id then
      raise exception 'idempotency key already used for a different pet' using errcode = 'check_violation';
    end if;
    return query
    select v_req.result ->> 'outcome', (v_req.result ->> 'is_sleeping')::boolean,
           (v_req.result ->> 'state_version')::bigint, (v_req.result ->> 'server_now')::timestamptz;
    return;
  end if;

  select p.* into v_pet from public.pets p where p.id = p_pet_id for update;
  if not found then
    raise exception 'pet not found' using errcode = 'no_data_found';
  end if;
  if not public.is_active_pet_caregiver(p_pet_id, v_user) then
    raise exception 'not a caregiver of this pet' using errcode = 'insufficient_privilege';
  end if;

  if v_pet.game_tz is null and public.pet_tz_is_valid(btrim(coalesce(p_client_tz, '')))
     and exists (
       select 1 from public.pet_caregivers c
       where c.pet_id = p_pet_id and c.user_id = v_user and c.status = 'active' and c.role = 'owner'
     ) then
    update public.pets p
    set game_tz = btrim(p_client_tz),
        current_game_date = (now() at time zone btrim(p_client_tz))::date,
        updated_at = now()
    where p.id = p_pet_id;
  end if;

  v_pet := public.resolve_pet_lifecycle(p_pet_id);
  v_now := now();

  if v_pet.status = 'dead' then
    v_outcome := 'dead';
  else
    select s.id into v_session
    from public.pet_sleep_sessions s
    where s.pet_id = p_pet_id and s.ended_at is null
    for update
    limit 1;
    if not found then
      v_outcome := 'not_sleeping';
    else
      update public.pet_sleep_sessions s
      set ended_at = v_now, ended_by = v_user
      where s.id = v_session;

      update public.pets p set state_version = p.state_version + 1, updated_at = v_now
      where p.id = p_pet_id
      returning p.* into v_pet;

      v_outcome := 'awake';
    end if;
  end if;

  insert into public.pet_core_requests (user_id, operation, idempotency_key, resource_id, result)
  values (
    v_user, 'wake_pet', v_key, p_pet_id,
    jsonb_build_object(
      'outcome', v_outcome, 'is_sleeping', false,
      'state_version', v_pet.state_version, 'server_now', v_now
    )
  );

  return query
  select v_outcome, false, v_pet.state_version, v_now;
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
  v_sleeping boolean;
  v_started timestamptz;
  v_sleep_today integer;
  v_day_start timestamptz;
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
    set game_tz = v_tz, current_game_date = (now() at time zone v_tz)::date, updated_at = now()
    where p.id = p_pet_id;
  elsif v_is_owner and v_pet.status = 'active' and v_pet.game_tz is not null
        and public.pet_tz_is_valid(v_tz) and v_pet.game_tz <> v_tz then
    update public.pets p set pending_game_tz = v_tz, updated_at = now() where p.id = p_pet_id;
  end if;

  v_pet := public.resolve_pet_lifecycle(p_pet_id);
  v_now := now();

  select s.started_at into v_started
  from public.pet_sleep_sessions s
  where s.pet_id = p_pet_id and s.ended_at is null
  limit 1;
  v_sleeping := v_started is not null;

  if v_pet.game_tz is not null and v_pet.current_game_date is not null then
    v_day_start := (v_pet.current_game_date::timestamp) at time zone v_pet.game_tz;
    v_sleep_today := public.pet_sleep_seconds(p_pet_id, v_day_start, v_now, v_pet.lifecycle_started_at);
  else
    v_sleep_today := 0;
  end if;

  return query
  select
    v_pet.id, v_pet.status, d.hunger_state, v_pet.last_fed_at, v_pet.died_at, v_pet.state_version,
    v_now, d.can_feed, d.next_feed_at, d.next_state_at,
    v_pet.game_tz, v_pet.pending_game_tz, v_pet.current_game_date,
    v_pet.meal_count_today, 3::smallint, v_pet.health, v_pet.hygiene,
    v_pet.is_refusing_food, v_pet.refusing_food_days, v_pet.sleep_debt_days,
    v_sleeping, v_started, v_sleep_today, 28800,
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

revoke execute on function public.pet_sleep_seconds(uuid, timestamptz, timestamptz, timestamptz) from public, anon, authenticated;
revoke execute on function public.start_pet_sleep(uuid, text, text) from public, anon;
revoke execute on function public.wake_pet(uuid, text, text) from public, anon;
revoke execute on function public.get_pet_room_state(uuid, text) from public, anon;

grant execute on function public.start_pet_sleep(uuid, text, text) to authenticated;
grant execute on function public.wake_pet(uuid, text, text) to authenticated;
grant execute on function public.get_pet_room_state(uuid, text) to authenticated;

commit;
