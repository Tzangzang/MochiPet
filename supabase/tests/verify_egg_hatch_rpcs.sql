select check_name, passed
from (

  select 'starter_species_seeded'::text as check_name,
    coalesce((select exists (
      select 1 from public.pet_species where code = 'starter_mochi' and is_active
    )), false) as passed

  union all
  select 'create_egg_is_security_definer',
    coalesce((select bool_or(p.prosecdef) from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'create_egg'), false)

  union all
  select 'start_incubation_is_security_definer',
    coalesce((select bool_or(p.prosecdef) from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'start_incubation'), false)

  union all
  select 'hatch_egg_is_security_definer',
    coalesce((select bool_or(p.prosecdef) from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'hatch_egg'), false)

  union all
  select 'rpcs_execute_granted_to_authenticated',
    coalesce(
      has_function_privilege('authenticated', 'public.create_egg(text,uuid)', 'EXECUTE')
      and has_function_privilege('authenticated', 'public.start_incubation(uuid,text)', 'EXECUTE')
      and has_function_privilege('authenticated', 'public.hatch_egg(uuid,text,text)', 'EXECUTE'),
      false)

  union all
  select 'rpcs_execute_revoked_from_anon',
    coalesce(
      not has_function_privilege('anon', 'public.create_egg(text,uuid)', 'EXECUTE')
      and not has_function_privilege('anon', 'public.start_incubation(uuid,text)', 'EXECUTE')
      and not has_function_privilege('anon', 'public.hatch_egg(uuid,text,text)', 'EXECUTE'),
      false)

  union all
  select 'idempotency_table_exists',
    coalesce(to_regclass('public.pet_core_idempotency') is not null, false)

  union all
  select 'idempotency_table_rls_enabled',
    coalesce((select c.relrowsecurity from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = 'pet_core_idempotency'), false)

  union all
  select 'idempotency_table_no_client_privileges',
    coalesce(
      not has_table_privilege('anon', 'public.pet_core_idempotency', 'SELECT')
      and not has_table_privilege('anon', 'public.pet_core_idempotency', 'INSERT')
      and not has_table_privilege('authenticated', 'public.pet_core_idempotency', 'SELECT')
      and not has_table_privilege('authenticated', 'public.pet_core_idempotency', 'INSERT')
      and not has_table_privilege('authenticated', 'public.pet_core_idempotency', 'UPDATE')
      and not has_table_privilege('authenticated', 'public.pet_core_idempotency', 'DELETE'),
      false)

  union all
  select 'rpcs_reference_auth_uid',
    coalesce((
      select bool_and(pg_get_functiondef(p.oid) ilike '%auth.uid()%')
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname in ('create_egg', 'start_incubation', 'hatch_egg')
    ), false)

  union all
  select 'rpcs_use_row_lock',
    coalesce((
      select bool_and(pg_get_functiondef(p.oid) ilike '%for update%')
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname in ('start_incubation', 'hatch_egg')
    ), false)

  union all
  select 'client_cannot_write_pet_core_tables',
    coalesce(
      not has_table_privilege('authenticated', 'public.pets', 'INSERT')
      and not has_table_privilege('authenticated', 'public.eggs', 'INSERT')
      and not has_table_privilege('authenticated', 'public.pet_caregivers', 'INSERT'),
      false)

  union all
  select 'no_feed_function_yet',
    coalesce(not exists (
      select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname ~ '(feed)'
    ), false)

) as checks
order by check_name;
