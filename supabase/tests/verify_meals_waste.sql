select check_name, passed
from (

  select 'feed_pet_returns_meal_and_waste_columns'::text as check_name,
    coalesce((select pg_get_functiondef(p.oid) ilike '%meal_count_today smallint%'
      and pg_get_functiondef(p.oid) ilike '%waste_available_at timestamp%'
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='feed_pet'), false) as passed

  union all
  select 'feed_pet_caps_meal_at_3',
    coalesce((select pg_get_functiondef(p.oid) ilike '%least(3,%'
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='feed_pet'), false)

  union all
  select 'feed_pet_needs_timezone_path',
    coalesce((select pg_get_functiondef(p.oid) ilike '%needs_timezone%'
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='feed_pet'), false)

  union all
  select 'feed_pet_still_uses_cooldown_helper',
    coalesce((select pg_get_functiondef(p.oid) ilike '%pet_feed_cooldown()%'
      and pg_get_functiondef(p.oid) not ilike '%5 minutes%'
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='feed_pet'), false)

  union all
  select 'feed_pet_creates_waste_30_minutes',
    coalesce((select pg_get_functiondef(p.oid) ilike '%30 minutes%'
      and pg_get_functiondef(p.oid) ilike '%pet_waste%'
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='feed_pet'), false)

  union all
  select 'feed_pet_no_meal_window_constants',
    coalesce((select pg_get_functiondef(p.oid) not ilike '%breakfast%'
      and pg_get_functiondef(p.oid) not ilike '%lunch%'
      and pg_get_functiondef(p.oid) not ilike '%dinner%'
      and pg_get_functiondef(p.oid) not ilike '%meal_window%'
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='feed_pet'), false)

  union all
  select 'resolver_exists',
    coalesce((select exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='resolve_pet_lifecycle')), false)

  union all
  select 'resolver_uses_decay_helper',
    coalesce((select pg_get_functiondef(p.oid) ilike '%pet_waste_decay_hours%'
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='resolve_pet_lifecycle'), false)

  union all
  select 'resolver_missed_meal_penalty_and_grace',
    coalesce((select pg_get_functiondef(p.oid) ilike '%v_missed * 8%'
      and pg_get_functiondef(p.oid) ilike '%is_grace%'
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='resolve_pet_lifecycle'), false)

  union all
  select 'resolver_death_still_120h',
    coalesce((select pg_get_functiondef(p.oid) ilike '%120 hours%'
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='resolve_pet_lifecycle'), false)

  union all
  select 'resolver_death_not_from_health_or_hygiene',
    coalesce((select pg_get_functiondef(p.oid) not ilike '%health <= 0%'
      and pg_get_functiondef(p.oid) not ilike '%hygiene <= 0%'
      and pg_get_functiondef(p.oid) not ilike '%health = 0 %'
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='resolve_pet_lifecycle'), false)

  union all
  select 'resolver_daily_state_conflict_guard',
    coalesce((select pg_get_functiondef(p.oid) ilike '%on conflict (pet_id, game_date) do nothing%'
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='resolve_pet_lifecycle'), false)

  union all
  select 'resolver_applies_pending_tz',
    coalesce((select pg_get_functiondef(p.oid) ilike '%pending%'
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='resolve_pet_lifecycle'), false)

  union all
  select 'tz_validation_uses_iana_catalog',
    coalesce((select pg_get_functiondef(p.oid) ilike '%pg_timezone_names%'
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='pet_tz_is_valid'), false)

  union all
  select 'set_tz_owner_only',
    coalesce((select pg_get_functiondef(p.oid) ilike '%only owner%'
      and pg_get_functiondef(p.oid) ilike '%role = ''owner''%'
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='set_pet_game_timezone'), false)

  union all
  select 'room_state_meals_required_3',
    coalesce((select pg_get_functiondef(p.oid) ilike '%3::smallint%'
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='get_pet_room_state'), false)

  union all
  select 'room_state_required_sleep_28800',
    coalesce((select pg_get_functiondef(p.oid) ilike '%28800%'
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='get_pet_room_state'), false)

  union all
  select 'room_state_waste_cap_5',
    coalesce((select pg_get_functiondef(p.oid) ilike '%limit 5%'
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='get_pet_room_state'), false)

  union all
  select 'room_state_only_owner_writes_tz',
    coalesce((select pg_get_functiondef(p.oid) ilike '%v_is_owner%'
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='get_pet_room_state'), false)

  union all
  select 'clean_hygiene_plus_8_once',
    coalesce((select pg_get_functiondef(p.oid) ilike '%hygiene + 8%'
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='clean_pet_waste'), false)

  union all
  select 'clean_idempotent_already_cleaned',
    coalesce((select pg_get_functiondef(p.oid) ilike '%already_cleaned%'
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='clean_pet_waste'), false)

  union all
  select 'lifecycle_functions_security_definer',
    coalesce((select bool_and(p.prosecdef)
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname in
        ('feed_pet','resolve_pet_lifecycle','set_pet_game_timezone','clean_pet_waste','get_pet_room_state')), false)

  union all
  select 'lifecycle_functions_empty_search_path',
    coalesce((select bool_and(exists (select 1 from unnest(p.proconfig) cfg where cfg='search_path=' or cfg='search_path=""'))
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname in
        ('feed_pet','resolve_pet_lifecycle','set_pet_game_timezone','clean_pet_waste','get_pet_room_state',
         'pet_tz_is_valid','pet_waste_decay_hours')), false)

  union all
  select 'resolver_and_decay_not_client_executable',
    coalesce(
      not has_function_privilege('authenticated','public.resolve_pet_lifecycle(uuid)','EXECUTE')
      and not has_function_privilege('anon','public.resolve_pet_lifecycle(uuid)','EXECUTE')
      and not has_function_privilege('authenticated','public.pet_waste_decay_hours(uuid,timestamptz,timestamptz)','EXECUTE'),
      false)

  union all
  select 'lifecycle_rpcs_granted_authenticated_revoked_anon',
    coalesce(
      has_function_privilege('authenticated','public.feed_pet(uuid,text)','EXECUTE')
      and has_function_privilege('authenticated','public.set_pet_game_timezone(uuid,text,text)','EXECUTE')
      and has_function_privilege('authenticated','public.clean_pet_waste(uuid,uuid,text)','EXECUTE')
      and has_function_privilege('authenticated','public.get_pet_room_state(uuid,text)','EXECUTE')
      and not has_function_privilege('anon','public.feed_pet(uuid,text)','EXECUTE')
      and not has_function_privilege('anon','public.clean_pet_waste(uuid,uuid,text)','EXECUTE')
      and not has_function_privilege('anon','public.get_pet_room_state(uuid,text)','EXECUTE'),
      false)

  union all
  select 'feed_pet_signature_unchanged',
    coalesce((select bool_or(pg_get_function_arguments(p.oid)='p_pet_id uuid, p_idempotency_key text')
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='feed_pet'), false)

  union all
  select 'feed_core_cooldown_helper_still_4h',
    coalesce((select pg_get_functiondef(p.oid) ilike '%interval ''4 hours''%'
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='pet_feed_cooldown'), false)

) as checks
order by check_name;
