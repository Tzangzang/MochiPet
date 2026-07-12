select check_name, passed
from (

  select 'feed_pet_function_exists'::text as check_name,
    coalesce((select exists (
      select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'feed_pet'
    )), false) as passed

  union all
  select 'feed_pet_signature_is_uuid_text',
    coalesce((select bool_or(pg_get_function_arguments(p.oid) = 'p_pet_id uuid, p_idempotency_key text')
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'feed_pet'), false)

  union all
  select 'feed_pet_does_not_accept_food_key',
    coalesce((select bool_and(pg_get_function_arguments(p.oid) not ilike '%food_key%')
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'feed_pet'), false)

  union all
  select 'get_pet_feed_state_function_exists',
    coalesce((select exists (
      select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'get_pet_feed_state'
    )), false)

  union all
  select 'pet_hunger_state_function_exists',
    coalesce((select exists (
      select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'pet_hunger_state'
    )), false)

  union all
  select 'pet_derived_state_function_exists',
    coalesce((select exists (
      select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'pet_derived_state'
    )), false)

  union all
  select 'feed_pet_is_security_definer',
    coalesce((select bool_or(p.prosecdef) from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'feed_pet'), false)

  union all
  select 'get_pet_feed_state_is_security_definer',
    coalesce((select bool_and(p.prosecdef) from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'get_pet_feed_state'), false)

  union all
  select 'resolve_pet_life_function_exists',
    coalesce((select exists (
      select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'resolve_pet_life'
    )), false)

  union all
  select 'resolve_pet_life_not_exposed_to_client',
    coalesce(
      not has_function_privilege('anon', 'public.resolve_pet_life(uuid)', 'EXECUTE')
      and not has_function_privilege('authenticated', 'public.resolve_pet_life(uuid)', 'EXECUTE'),
      false)

  union all
  select 'resolve_pet_life_is_security_definer_locked_path',
    coalesce((select
      p.prosecdef
      and pg_get_functiondef(p.oid) ilike '%for update%'
      and pg_get_functiondef(p.oid) ilike '%pet_hunger_state%'
      and pg_get_functiondef(p.oid) ilike '%last_fed_at + interval ''120 hours''%'
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'resolve_pet_life'), false)

  union all
  select 'feed_pet_uses_resolve_transition',
    coalesce((select pg_get_functiondef(p.oid) ilike '%resolve_pet_life%'
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'feed_pet'), false)

  union all
  select 'get_pet_feed_state_uses_resolve_transition',
    coalesce((select pg_get_functiondef(p.oid) ilike '%resolve_pet_life%'
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'get_pet_feed_state'), false)

  union all
  select 'get_pet_feed_state_uses_auth_uid_and_lock_and_caregiver',
    coalesce((select
      pg_get_functiondef(p.oid) ilike '%auth.uid()%'
      and pg_get_functiondef(p.oid) ilike '%for update%'
      and pg_get_functiondef(p.oid) ilike '%is_active_pet_caregiver%'
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'get_pet_feed_state'), false)

  union all
  select 'died_at_is_last_fed_plus_120h',
    coalesce((select pg_get_functiondef(p.oid) ilike '%last_fed_at + interval ''120 hours''%'
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'resolve_pet_life'), false)

  union all
  select 'feed_functions_have_empty_search_path',
    coalesce((select bool_and(
      exists (select 1 from unnest(p.proconfig) cfg where cfg = 'search_path=' or cfg = 'search_path=""')
    ) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname in ('feed_pet', 'get_pet_feed_state', 'pet_hunger_state', 'pet_derived_state', 'pet_feed_cooldown')), false)

  union all
  select 'feed_pet_execute_granted_to_authenticated',
    coalesce(has_function_privilege('authenticated', 'public.feed_pet(uuid,text)', 'EXECUTE'), false)

  union all
  select 'feed_pet_execute_revoked_from_anon',
    coalesce(not has_function_privilege('anon', 'public.feed_pet(uuid,text)', 'EXECUTE'), false)

  union all
  select 'get_pet_feed_state_granted_authenticated_revoked_anon',
    coalesce(
      has_function_privilege('authenticated', 'public.get_pet_feed_state(uuid)', 'EXECUTE')
      and not has_function_privilege('anon', 'public.get_pet_feed_state(uuid)', 'EXECUTE'),
      false)

  union all
  select 'request_operation_check_allows_feed_pet',
    coalesce((select exists (
      select 1 from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      join pg_namespace n on n.oid = t.relnamespace
      where n.nspname = 'public' and t.relname = 'pet_core_requests'
        and c.conname = 'pet_core_requests_operation_valid'
        and pg_get_constraintdef(c.oid) ilike '%feed_pet%'
    )), false)

  union all
  select 'feed_pet_uses_auth_uid',
    coalesce((select pg_get_functiondef(p.oid) ilike '%auth.uid()%'
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'feed_pet'), false)

  union all
  select 'feed_pet_uses_for_update',
    coalesce((select pg_get_functiondef(p.oid) ilike '%for update%'
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'feed_pet'), false)

  union all
  select 'feed_pet_uses_advisory_lock',
    coalesce((select pg_get_functiondef(p.oid) ilike '%pg_advisory_xact_lock%'
      and pg_get_functiondef(p.oid) ilike '%:feed_pet:%'
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'feed_pet'), false)

  union all
  select 'feed_pet_writes_basic_meal',
    coalesce((select pg_get_functiondef(p.oid) ilike '%basic_meal%'
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'feed_pet'), false)

  union all
  select 'pet_feed_cooldown_returns_4_hours',
    coalesce((select pg_get_functiondef(p.oid) ilike '%interval ''4 hours''%'
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'pet_feed_cooldown'), false)

  union all
  select 'feed_pet_cooldown_uses_four_hour_helper',
    coalesce((select pg_get_functiondef(p.oid) ilike '%pet_feed_cooldown()%'
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'feed_pet'), false)

  union all
  select 'derived_state_cooldown_uses_four_hour_helper',
    coalesce((select pg_get_functiondef(p.oid) ilike '%pet_feed_cooldown()%'
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'pet_derived_state'), false)

  union all
  select 'no_five_minute_cooldown_in_active_feed_functions',
    coalesce((select bool_and(pg_get_functiondef(p.oid) not ilike '%5 minutes%')
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname in ('feed_pet', 'pet_derived_state', 'get_pet_feed_state')), false)

  union all
  select 'cooldown_migration_applied',
    coalesce((select exists (
      select 1 from supabase_migrations.schema_migrations
      where version = '20260712010000'
    )), false)

  union all
  select 'hunger_thresholds_are_24_48_72_96_120',
    coalesce((select
      pg_get_functiondef(p.oid) ilike '%24 hours%'
      and pg_get_functiondef(p.oid) ilike '%48 hours%'
      and pg_get_functiondef(p.oid) ilike '%72 hours%'
      and pg_get_functiondef(p.oid) ilike '%96 hours%'
      and pg_get_functiondef(p.oid) ilike '%120 hours%'
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'pet_hunger_state'), false)

  union all
  select 'derived_state_reuses_hunger_helper',
    coalesce((select pg_get_functiondef(p.oid) ilike '%pet_hunger_state%'
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'pet_derived_state'), false)

  union all
  select 'feed_pet_persists_death',
    coalesce((select pg_get_functiondef(p.oid) ilike '%died_at%'
      and pg_get_functiondef(p.oid) ilike '%''dead''%'
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'feed_pet'), false)

  union all
  select 'feed_pet_has_no_revive_path',
    coalesce((select
      pg_get_functiondef(p.oid) not ilike '%died_at = null%'
      and pg_get_functiondef(p.oid) not ilike '%status = ''active''%'
      and pg_get_functiondef(p.oid) not ilike '%revive%'
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'feed_pet'), false)

  union all
  select 'feed_pet_uses_database_now',
    coalesce((select pg_get_functiondef(p.oid) ilike '%now()%'
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'feed_pet'), false)

  union all
  select 'feed_pet_idempotency_conflict_path',
    coalesce((select pg_get_functiondef(p.oid) ilike '%different pet%'
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'feed_pet'), false)

  union all
  select 'authenticated_cannot_write_pet_core_tables',
    coalesce(
      not has_table_privilege('authenticated', 'public.pets', 'INSERT')
      and not has_table_privilege('authenticated', 'public.pets', 'UPDATE')
      and not has_table_privilege('authenticated', 'public.pets', 'DELETE')
      and not has_table_privilege('authenticated', 'public.pet_feeding_logs', 'INSERT')
      and not has_table_privilege('authenticated', 'public.pet_core_requests', 'INSERT'),
      false)

  union all
  select 'hatch_egg_initializes_feed_state',
    coalesce((select
      pg_get_functiondef(p.oid) ilike '%last_fed_at%'
      and pg_get_functiondef(p.oid) ilike '%''active''%'
      and pg_get_functiondef(p.oid) ilike '%state_version%'
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'hatch_egg'), false)

  union all
  select 'pets_has_no_is_dead_or_level_columns',
    coalesce(not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'pets'
        and column_name in ('is_dead', 'level', 'xp', 'energy', 'happiness')
    ), false)

) as checks
order by check_name;
