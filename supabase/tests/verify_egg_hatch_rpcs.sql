select check_name, passed
from (

  select 'starter_species_exists'::text as check_name,
    coalesce((select exists (select 1 from public.pet_species where code = 'starter_mochi' and is_active)), false) as passed

  union all
  select 'exactly_one_placeholder_species',
    coalesce((select count(*) = 1 from public.pet_species), false)

  union all
  select 'request_table_exists',
    coalesce(to_regclass('public.pet_core_requests') is not null, false)

  union all
  select 'request_table_rls_enabled',
    coalesce((select c.relrowsecurity from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = 'pet_core_requests'), false)

  union all
  select 'request_table_has_unique_idempotency_constraint',
    coalesce((select exists (
      select 1 from pg_constraint con
      join pg_class t on t.oid = con.conrelid
      join pg_namespace n on n.oid = t.relnamespace
      where n.nspname = 'public' and t.relname = 'pet_core_requests' and con.contype = 'u'
    )), false)

  union all
  select 'authenticated_has_no_request_table_write_privileges',
    coalesce(
      not has_table_privilege('authenticated', 'public.pet_core_requests', 'INSERT')
      and not has_table_privilege('authenticated', 'public.pet_core_requests', 'UPDATE')
      and not has_table_privilege('authenticated', 'public.pet_core_requests', 'DELETE'),
      false)

  union all
  select 'anon_has_no_request_table_privileges',
    coalesce(
      not has_table_privilege('anon', 'public.pet_core_requests', 'SELECT')
      and not has_table_privilege('anon', 'public.pet_core_requests', 'INSERT')
      and not has_table_privilege('anon', 'public.pet_core_requests', 'UPDATE')
      and not has_table_privilege('anon', 'public.pet_core_requests', 'DELETE'),
      false)

  union all
  select 'create_egg_function_exists',
    coalesce((select exists (select 1 from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'create_egg')), false)

  union all
  select 'start_incubation_function_exists',
    coalesce((select exists (select 1 from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'start_egg_incubation')), false)

  union all
  select 'hatch_egg_function_exists',
    coalesce((select exists (select 1 from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'hatch_egg')), false)

  union all
  select 'rpc_functions_are_security_definer',
    coalesce((select bool_and(p.prosecdef) from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname in ('create_egg', 'start_egg_incubation', 'hatch_egg')), false)

  union all
  select 'rpc_functions_have_empty_search_path',
    coalesce((select bool_and(
      exists (select 1 from unnest(p.proconfig) as cfg
        where cfg = 'search_path=' or cfg = 'search_path=""')
    ) from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname in ('create_egg', 'start_egg_incubation', 'hatch_egg')), false)

  union all
  select 'rpc_execute_revoked_from_anon',
    coalesce(
      not has_function_privilege('anon', 'public.create_egg(text,text)', 'EXECUTE')
      and not has_function_privilege('anon', 'public.start_egg_incubation(uuid,text)', 'EXECUTE')
      and not has_function_privilege('anon', 'public.hatch_egg(uuid,text,text)', 'EXECUTE'),
      false)

  union all
  select 'rpc_execute_granted_to_authenticated',
    coalesce(
      has_function_privilege('authenticated', 'public.create_egg(text,text)', 'EXECUTE')
      and has_function_privilege('authenticated', 'public.start_egg_incubation(uuid,text)', 'EXECUTE')
      and has_function_privilege('authenticated', 'public.hatch_egg(uuid,text,text)', 'EXECUTE'),
      false)

  union all
  select 'create_egg_uses_auth_uid',
    coalesce((select pg_get_functiondef(p.oid) ilike '%auth.uid()%'
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'create_egg'), false)

  union all
  select 'create_egg_has_concurrency_lock',
    coalesce((select pg_get_functiondef(p.oid) ilike '%pg_advisory_xact_lock%'
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'create_egg'), false)

  union all
  select 'create_egg_enforces_one_active_egg',
    coalesce((select pg_get_functiondef(p.oid) ilike '%unhatched%'
      and pg_get_functiondef(p.oid) ilike '%incubating%'
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'create_egg'), false)

  union all
  select 'start_incubation_uses_for_update',
    coalesce((select pg_get_functiondef(p.oid) ilike '%for update%'
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'start_egg_incubation'), false)

  union all
  select 'start_incubation_uses_auth_uid',
    coalesce((select pg_get_functiondef(p.oid) ilike '%auth.uid()%'
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'start_egg_incubation'), false)

  union all
  select 'incubation_duration_is_server_defined',
    coalesce((select pg_get_functiondef(p.oid) ilike '%interval ''5 minutes''%'
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'start_egg_incubation'), false)

  union all
  select 'hatch_egg_uses_for_update',
    coalesce((select pg_get_functiondef(p.oid) ilike '%for update%'
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'hatch_egg'), false)

  union all
  select 'hatch_egg_uses_auth_uid',
    coalesce((select pg_get_functiondef(p.oid) ilike '%auth.uid()%'
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'hatch_egg'), false)

  union all
  select 'hatch_uses_database_now',
    coalesce((select pg_get_functiondef(p.oid) ilike '%now()%'
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'hatch_egg'), false)

  union all
  select 'hatch_checks_hatches_at',
    coalesce((select pg_get_functiondef(p.oid) ilike '%hatches_at%'
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'hatch_egg'), false)

  union all
  select 'hatch_creates_owner_caregiver',
    coalesce((select pg_get_functiondef(p.oid) ilike '%pet_caregivers%'
      and pg_get_functiondef(p.oid) ilike '%owner%'
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'hatch_egg'), false)

  union all
  select 'hatch_updates_egg_status',
    coalesce((select pg_get_functiondef(p.oid) ilike '%hatched%'
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'hatch_egg'), false)

  union all
  select 'egg_id_unique_pet_constraint_intact',
    coalesce((select exists (
      select 1 from pg_constraint con
      join pg_class t on t.oid = con.conrelid
      join pg_namespace n on n.oid = t.relnamespace
      where n.nspname = 'public' and t.relname = 'pets' and con.contype = 'u'
    )), false)

  union all
  select 'authenticated_still_has_no_direct_pet_core_writes',
    coalesce(
      not has_table_privilege('authenticated', 'public.pets', 'INSERT')
      and not has_table_privilege('authenticated', 'public.eggs', 'INSERT')
      and not has_table_privilege('authenticated', 'public.pet_caregivers', 'INSERT')
      and not has_table_privilege('authenticated', 'public.pet_species', 'INSERT')
      and not has_table_privilege('authenticated', 'public.pet_feeding_logs', 'INSERT')
      and not has_table_privilege('authenticated', 'public.pet_core_requests', 'INSERT'),
      false)

  union all
  select 'no_feed_rpc_yet',
    coalesce(not exists (select 1 from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname ~ 'feed'), false)

  union all
  select 'no_coop_invite_rpc_yet',
    coalesce(not exists (select 1 from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname ~ '(invite|coop)'), false)

  union all
  select 'no_scheduled_job_created',
    coalesce(not exists (select 1 from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname ~ '(schedule|cron)'), false)

  union all
  select 'no_ui_or_artwork_table_created',
    coalesce(not exists (
      select 1 from information_schema.tables
      where table_schema = 'public'
        and table_name in (
          'ui', 'artwork', 'assets', 'inventory_items', 'item_catalog',
          'purchases', 'subscriptions', 'notifications', 'rooms'
        )
    ), false)

  union all
  select 'one_active_egg_partial_unique_index_exists',
    coalesce(exists (
      select 1 from pg_indexes
      where schemaname = 'public' and indexname = 'eggs_one_active_per_owner'
    ), false)

  union all
  select 'one_active_egg_index_has_correct_predicate',
    coalesce((
      select pg_get_indexdef(i.indexrelid) ilike '%unhatched%'
        and pg_get_indexdef(i.indexrelid) ilike '%incubating%'
        and pg_get_indexdef(i.indexrelid) ilike '%owner_user_id%'
        and indisunique
      from pg_index i
      join pg_class c on c.oid = i.indexrelid
      where c.relname = 'eggs_one_active_per_owner'
    ), false)

  union all
  select 'create_egg_has_idempotency_advisory_lock',
    coalesce((select pg_get_functiondef(p.oid) ilike '%:create_egg:%'
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'create_egg'), false)

  union all
  select 'start_incubation_has_idempotency_advisory_lock',
    coalesce((select pg_get_functiondef(p.oid) ilike '%:start_incubation:%'
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'start_egg_incubation'), false)

  union all
  select 'hatch_egg_has_idempotency_advisory_lock',
    coalesce((select pg_get_functiondef(p.oid) ilike '%:hatch_egg:%'
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'hatch_egg'), false)

  union all
  select 'create_egg_rejects_mismatched_species_replay',
    coalesce((select pg_get_functiondef(p.oid) ilike '%a different species%'
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'create_egg'), false)

  union all
  select 'start_incubation_rejects_mismatched_egg_replay',
    coalesce((select pg_get_functiondef(p.oid) ilike '%a different egg%'
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'start_egg_incubation'), false)

  union all
  select 'hatch_rejects_mismatched_egg_replay',
    coalesce((select pg_get_functiondef(p.oid) ilike '%<> p_egg_id%'
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'hatch_egg'), false)

  union all
  select 'hatch_rejects_mismatched_pet_name_replay',
    coalesce((select pg_get_functiondef(p.oid) ilike '%<> v_name%'
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'hatch_egg'), false)

) as checks
order by check_name;
