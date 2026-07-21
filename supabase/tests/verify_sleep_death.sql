select check_name, passed
from (

  select 'start_pet_sleep_signature'::text as check_name,
    coalesce((select bool_or(pg_get_function_arguments(p.oid)='p_pet_id uuid, p_client_tz text, p_idempotency_key text')
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='start_pet_sleep'), false) as passed

  union all
  select 'wake_pet_signature',
    coalesce((select bool_or(pg_get_function_arguments(p.oid)='p_pet_id uuid, p_client_tz text, p_idempotency_key text')
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='wake_pet'), false)

  union all
  select 'sleep_rpcs_security_definer',
    coalesce((select bool_and(p.prosecdef)
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname in ('start_pet_sleep','wake_pet')), false)

  union all
  select 'sleep_functions_empty_search_path',
    coalesce((select bool_and(exists (select 1 from unnest(p.proconfig) cfg where cfg='search_path=' or cfg='search_path=""'))
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname in ('start_pet_sleep','wake_pet','pet_sleep_seconds')), false)

  union all
  select 'sleep_rpcs_granted_authenticated_revoked_anon',
    coalesce(
      has_function_privilege('authenticated','public.start_pet_sleep(uuid,text,text)','EXECUTE')
      and has_function_privilege('authenticated','public.wake_pet(uuid,text,text)','EXECUTE')
      and not has_function_privilege('anon','public.start_pet_sleep(uuid,text,text)','EXECUTE')
      and not has_function_privilege('anon','public.wake_pet(uuid,text,text)','EXECUTE'),
      false)

  union all
  select 'pet_sleep_seconds_not_client_executable',
    coalesce(
      not has_function_privilege('authenticated','public.pet_sleep_seconds(uuid,timestamptz,timestamptz,timestamptz)','EXECUTE')
      and not has_function_privilege('anon','public.pet_sleep_seconds(uuid,timestamptz,timestamptz,timestamptz)','EXECUTE'),
      false)

  union all
  select 'resolver_uses_sleep_seconds_helper',
    coalesce((select pg_get_functiondef(p.oid) ilike '%pet_sleep_seconds%'
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='resolve_pet_lifecycle'), false)

  union all
  select 'resolver_required_sleep_28800',
    coalesce((select pg_get_functiondef(p.oid) ilike '%28800%'
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='resolve_pet_lifecycle'), false)

  union all
  select 'resolver_debt_increment_and_decrement',
    coalesce((select pg_get_functiondef(p.oid) ilike '%v_debt + 1%'
      and pg_get_functiondef(p.oid) ilike '%v_debt - 1%'
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='resolve_pet_lifecycle'), false)

  union all
  select 'resolver_refusing_threshold_7',
    coalesce((select pg_get_functiondef(p.oid) ilike '%v_debt >= 7%'
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='resolve_pet_lifecycle'), false)

  union all
  select 'resolver_death2_refusing_three_days',
    coalesce((select pg_get_functiondef(p.oid) ilike '%v_refusing_days >= 3%'
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='resolve_pet_lifecycle'), false)

  union all
  select 'resolver_exactly_two_death_causes',
    coalesce((select regexp_count(pg_get_functiondef(p.oid), 'v_status := ''dead''') = 2
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='resolve_pet_lifecycle'), false)

  union all
  select 'resolver_death_not_from_health_or_hygiene',
    coalesce((select pg_get_functiondef(p.oid) not ilike '%health <= 0%'
      and pg_get_functiondef(p.oid) not ilike '%hygiene <= 0%'
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='resolve_pet_lifecycle'), false)

  union all
  select 'resolver_grace_excluded_from_debt',
    coalesce((select pg_get_functiondef(p.oid) ilike '%if v_inserted and not v_is_grace%'
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='resolve_pet_lifecycle'), false)

  union all
  select 'feed_pet_refusing_food_outcome',
    coalesce((select pg_get_functiondef(p.oid) ilike '%refusing_food%'
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='feed_pet'), false)

  union all
  select 'wake_pet_closes_open_session',
    coalesce((select pg_get_functiondef(p.oid) ilike '%ended_at = v_now%'
      and pg_get_functiondef(p.oid) ilike '%not_sleeping%'
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='wake_pet'), false)

  union all
  select 'start_pet_sleep_prevents_double',
    coalesce((select pg_get_functiondef(p.oid) ilike '%already_sleeping%'
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='start_pet_sleep'), false)

  union all
  select 'room_state_returns_sleep_fields',
    coalesce((select pg_get_functiondef(p.oid) ilike '%sleep_seconds_today integer%'
      and pg_get_functiondef(p.oid) ilike '%is_sleeping boolean%'
      and pg_get_functiondef(p.oid) ilike '%current_sleep_started_at timestamp%'
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='get_pet_room_state'), false)

  union all
  select 'one_open_sleep_session_index',
    coalesce((select indexdef ilike '%unique%' and indexdef ilike '%ended_at is null%'
      from pg_indexes where schemaname='public' and indexname='pet_sleep_sessions_one_open'), false)

  union all
  select 'feed_core_cooldown_still_four_hours',
    coalesce((select pg_get_functiondef(p.oid) ilike '%pet_feed_cooldown()%'
      and pg_get_functiondef(p.oid) not ilike '%5 minutes%'
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='feed_pet'), false)

) as checks
order by check_name;
