select check_name, passed
from (

  select 'pets_has_all_lifecycle_columns'::text as check_name,
    coalesce((select count(*) = 11 from information_schema.columns
      where table_schema='public' and table_name='pets'
        and column_name in ('game_tz','pending_game_tz','health','hygiene','meal_count_today',
          'current_game_date','sleep_debt_days','refusing_food_days','is_refusing_food',
          'stats_resolved_at','lifecycle_started_at')), false) as passed

  union all
  select 'pets_health_default_100',
    coalesce((select column_default = '100' from information_schema.columns
      where table_schema='public' and table_name='pets' and column_name='health'), false)

  union all
  select 'pets_hygiene_default_100',
    coalesce((select column_default = '100' from information_schema.columns
      where table_schema='public' and table_name='pets' and column_name='hygiene'), false)

  union all
  select 'pets_meal_count_default_0',
    coalesce((select column_default = '0' from information_schema.columns
      where table_schema='public' and table_name='pets' and column_name='meal_count_today'), false)

  union all
  select 'pets_is_refusing_default_false',
    coalesce((select column_default = 'false' from information_schema.columns
      where table_schema='public' and table_name='pets' and column_name='is_refusing_food'), false)

  union all
  select 'pets_stats_resolved_default_now',
    coalesce((select column_default ilike '%now()%' from information_schema.columns
      where table_schema='public' and table_name='pets' and column_name='stats_resolved_at'), false)

  union all
  select 'pets_lifecycle_started_default_now',
    coalesce((select column_default ilike '%now()%' from information_schema.columns
      where table_schema='public' and table_name='pets' and column_name='lifecycle_started_at'), false)

  union all
  select 'pets_health_hygiene_bounds_constraints',
    coalesce((select count(*) = 2 from pg_constraint
      where conrelid='public.pets'::regclass and conname in ('pets_health_bounds','pets_hygiene_bounds')), false)

  union all
  select 'pets_meal_count_bounds_0_3',
    coalesce((select pg_get_constraintdef(oid) ilike '%>= 0%' and pg_get_constraintdef(oid) ilike '%<= 3%'
      from pg_constraint
      where conrelid='public.pets'::regclass and conname='pets_meal_count_bounds'), false)

  union all
  select 'pets_sleep_and_refusing_bounds',
    coalesce((select count(*) = 2 from pg_constraint
      where conrelid='public.pets'::regclass and conname in ('pets_sleep_debt_bounds','pets_refusing_days_bounds')), false)

  union all
  select 'pets_game_tz_not_blank_constraints',
    coalesce((select count(*) = 2 from pg_constraint
      where conrelid='public.pets'::regclass and conname in ('pets_game_tz_not_blank','pets_pending_game_tz_not_blank')), false)

  union all
  select 'pets_has_no_numeric_hunger_column',
    coalesce(not exists (select 1 from information_schema.columns
      where table_schema='public' and table_name='pets'
        and column_name in ('hunger','hunger_level','hunger_value','satiety')), false)

  union all
  select 'daily_states_table_exists',
    coalesce((select exists (select 1 from information_schema.tables
      where table_schema='public' and table_name='pet_daily_states')), false)

  union all
  select 'daily_states_pk_pet_game_date',
    coalesce((select pg_get_constraintdef(oid) ilike '%(pet_id, game_date)%' from pg_constraint
      where conrelid='public.pet_daily_states'::regclass and contype='p'), false)

  union all
  select 'daily_states_meal_missed_bounds',
    coalesce((select count(*) = 2 from pg_constraint
      where conrelid='public.pet_daily_states'::regclass
        and conname in ('pet_daily_states_meal_count_bounds','pet_daily_states_missed_meals_bounds')), false)

  union all
  select 'sleep_sessions_table_exists',
    coalesce((select exists (select 1 from information_schema.tables
      where table_schema='public' and table_name='pet_sleep_sessions')), false)

  union all
  select 'sleep_sessions_one_open_partial_unique',
    coalesce((select indexdef ilike '%unique%' and indexdef ilike '%ended_at is null%'
      from pg_indexes where schemaname='public' and indexname='pet_sleep_sessions_one_open'), false)

  union all
  select 'sleep_sessions_end_after_start',
    coalesce((select exists (select 1 from pg_constraint
      where conrelid='public.pet_sleep_sessions'::regclass and conname='pet_sleep_sessions_end_after_start')), false)

  union all
  select 'waste_table_exists',
    coalesce((select exists (select 1 from information_schema.tables
      where table_schema='public' and table_name='pet_waste')), false)

  union all
  select 'waste_source_feed_unique',
    coalesce((select exists (select 1 from pg_constraint
      where conrelid='public.pet_waste'::regclass and contype='u'
        and pg_get_constraintdef(oid) ilike '%source_feeding_log_id%')), false)

  union all
  select 'waste_clean_after_available',
    coalesce((select exists (select 1 from pg_constraint
      where conrelid='public.pet_waste'::regclass and conname='pet_waste_clean_after_available')), false)

  union all
  select 'waste_pos_seed_bounds',
    coalesce((select pg_get_constraintdef(oid) ilike '%>= 0%' and pg_get_constraintdef(oid) ilike '%<= 32767%'
      from pg_constraint
      where conrelid='public.pet_waste'::regclass and conname='pet_waste_pos_seed_bounds'), false)

  union all
  select 'operation_constraint_keeps_old_operations',
    coalesce((select
      pg_get_constraintdef(oid) ilike '%create_egg%'
      and pg_get_constraintdef(oid) ilike '%start_incubation%'
      and pg_get_constraintdef(oid) ilike '%hatch_egg%'
      and pg_get_constraintdef(oid) ilike '%feed_pet%'
      from pg_constraint
      where conrelid='public.pet_core_requests'::regclass and conname='pet_core_requests_operation_valid'), false)

  union all
  select 'operation_constraint_accepts_new_operations',
    coalesce((select
      pg_get_constraintdef(oid) ilike '%set_game_tz%'
      and pg_get_constraintdef(oid) ilike '%start_pet_sleep%'
      and pg_get_constraintdef(oid) ilike '%wake_pet%'
      and pg_get_constraintdef(oid) ilike '%clean_pet_waste%'
      from pg_constraint
      where conrelid='public.pet_core_requests'::regclass and conname='pet_core_requests_operation_valid'), false)

  union all
  select 'authenticated_cannot_write_new_tables',
    coalesce(
      not has_table_privilege('authenticated','public.pet_daily_states','INSERT')
      and not has_table_privilege('authenticated','public.pet_daily_states','UPDATE')
      and not has_table_privilege('authenticated','public.pet_daily_states','DELETE')
      and not has_table_privilege('authenticated','public.pet_sleep_sessions','INSERT')
      and not has_table_privilege('authenticated','public.pet_sleep_sessions','UPDATE')
      and not has_table_privilege('authenticated','public.pet_sleep_sessions','DELETE')
      and not has_table_privilege('authenticated','public.pet_waste','INSERT')
      and not has_table_privilege('authenticated','public.pet_waste','UPDATE')
      and not has_table_privilege('authenticated','public.pet_waste','DELETE'),
      false)

  union all
  select 'authenticated_can_select_new_tables',
    coalesce(
      has_table_privilege('authenticated','public.pet_daily_states','SELECT')
      and has_table_privilege('authenticated','public.pet_sleep_sessions','SELECT')
      and has_table_privilege('authenticated','public.pet_waste','SELECT'),
      false)

  union all
  select 'new_tables_rls_enabled',
    coalesce((select bool_and(relrowsecurity) from pg_class
      where relname in ('pet_daily_states','pet_sleep_sessions','pet_waste')
        and relnamespace = 'public'::regnamespace), false)

  union all
  select 'authenticated_still_cannot_write_pets',
    coalesce(
      not has_table_privilege('authenticated','public.pets','INSERT')
      and not has_table_privilege('authenticated','public.pets','UPDATE')
      and not has_table_privilege('authenticated','public.pets','DELETE'),
      false)

  union all
  select 'feed_core_cooldown_still_four_hours',
    coalesce((select
      pg_get_functiondef(p.oid) ilike '%pet_feed_cooldown()%'
      and pg_get_functiondef(p.oid) not ilike '%5 minutes%'
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname='public' and p.proname='feed_pet'), false)

  union all
  select 'resolve_pet_life_still_exists_120h',
    coalesce((select pg_get_functiondef(p.oid) ilike '%120 hours%'
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname='public' and p.proname='resolve_pet_life'), false)

  union all
  select 'is_active_pet_caregiver_empty_search_path',
    coalesce((select exists (select 1 from unnest(p.proconfig) cfg
        where cfg='search_path=' or cfg='search_path=""')
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname='public' and p.proname='is_active_pet_caregiver'), false)

) as checks
order by check_name;
