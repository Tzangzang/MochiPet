select check_name, passed
from (

  select 'invitations_has_token_and_code_hash'::text as check_name,
    coalesce((select count(*) = 2 from information_schema.columns
      where table_schema='public' and table_name='pet_caregiver_invitations'
        and column_name in ('token_hash','code_hash')), false) as passed

  union all
  select 'invitations_no_raw_token_or_code_columns',
    coalesce(not exists (select 1 from information_schema.columns
      where table_schema='public' and table_name='pet_caregiver_invitations'
        and column_name in ('token','code','raw_token','raw_code','invite_token','invite_code')), false)

  union all
  select 'token_and_code_hash_unique',
    coalesce((select count(*) = 2 from pg_constraint
      where conrelid='public.pet_caregiver_invitations'::regclass and contype='u'
        and (pg_get_constraintdef(oid) ilike '%token_hash%' or pg_get_constraintdef(oid) ilike '%code_hash%')), false)

  union all
  select 'one_pending_invitation_partial_unique',
    coalesce((select indexdef ilike '%unique%' and indexdef ilike '%accepted_at is null%' and indexdef ilike '%revoked_at is null%'
      from pg_indexes where schemaname='public' and indexname='pet_caregiver_invitations_one_pending'), false)

  union all
  select 'accepted_and_revoked_not_both',
    coalesce((select exists (select 1 from pg_constraint
      where conrelid='public.pet_caregiver_invitations'::regclass and conname='pet_caregiver_invitations_not_both')), false)

  union all
  select 'attempts_table_exists',
    coalesce((select exists (select 1 from information_schema.tables
      where table_schema='public' and table_name='pet_invitation_attempts')), false)

  union all
  select 'operation_constraint_keeps_old',
    coalesce((select pg_get_constraintdef(oid) ilike '%create_egg%' and pg_get_constraintdef(oid) ilike '%clean_pet_waste%'
      from pg_constraint where conrelid='public.pet_core_requests'::regclass and conname='pet_core_requests_operation_valid'), false)

  union all
  select 'operation_constraint_adds_invitation_ops',
    coalesce((select
      pg_get_constraintdef(oid) ilike '%create_invitation%'
      and pg_get_constraintdef(oid) ilike '%accept_invitation%'
      and pg_get_constraintdef(oid) ilike '%revoke_invitation%'
      and pg_get_constraintdef(oid) ilike '%remove_co_parent%'
      and pg_get_constraintdef(oid) ilike '%leave_pet%'
      from pg_constraint where conrelid='public.pet_core_requests'::regclass and conname='pet_core_requests_operation_valid'), false)

  union all
  select 'hash_uses_sha256',
    coalesce((select pg_get_functiondef(p.oid) ilike '%sha256%'
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='pet_invitation_hash'), false)

  union all
  select 'normalize_uppercases_and_strips',
    coalesce((select pg_get_functiondef(p.oid) ilike '%upper(%' and pg_get_functiondef(p.oid) ilike '%[^a-z0-9]%'
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='pet_invitation_normalize_code'), false)

  union all
  select 'code_alphabet_excludes_confusing_chars',
    coalesce((select
      pg_get_functiondef(p.oid) ilike '%23456789ABCDEFGHJKLMNPQRSTUVWXYZ%'
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='pet_invitation_generate_code'), false)

  union all
  select 'create_owner_only_24h_256bit_token',
    coalesce((select
      pg_get_functiondef(p.oid) ilike '%only owner%'
      and pg_get_functiondef(p.oid) ilike '%24 hours%'
      and pg_get_functiondef(p.oid) ilike '%gen_random_bytes(32)%'
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='create_pet_caregiver_invitation'), false)

  union all
  select 'accept_requires_exactly_one_input',
    coalesce((select pg_get_functiondef(p.oid) ilike '%exactly one of token or code%'
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='accept_pet_caregiver_invitation'), false)

  union all
  select 'accept_is_idempotent_and_guards',
    coalesce((select
      pg_get_functiondef(p.oid) ilike '%pet_core_requests%'
      and pg_get_functiondef(p.oid) ilike '%self_owner%'
      and pg_get_functiondef(p.oid) ilike '%already_caregiver%'
      and pg_get_functiondef(p.oid) ilike '%pet_full%'
      and pg_get_functiondef(p.oid) ilike '%rate_limited%'
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='accept_pet_caregiver_invitation'), false)

  union all
  select 'preview_does_not_return_owner_email',
    coalesce((select pg_get_functiondef(p.oid) not ilike '%.email%' and pg_get_functiondef(p.oid) not ilike '% email %'
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='preview_pet_caregiver_invitation'), false)

  union all
  select 'rate_limit_10_failed_in_10_minutes',
    coalesce((select pg_get_functiondef(p.oid) ilike '%< 10%' and pg_get_functiondef(p.oid) ilike '%10 minutes%'
      and pg_get_functiondef(p.oid) ilike '%failed%'
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='pet_invitation_within_rate_limit'), false)

  union all
  select 'invitation_rpcs_security_definer',
    coalesce((select bool_and(p.prosecdef)
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname in
        ('create_pet_caregiver_invitation','revoke_pet_caregiver_invitation','preview_pet_caregiver_invitation',
         'accept_pet_caregiver_invitation','remove_pet_co_parent','leave_pet_as_co_parent','get_pet_coparent_state')), false)

  union all
  select 'invitation_functions_empty_search_path',
    coalesce((select bool_and(exists (select 1 from unnest(p.proconfig) cfg where cfg='search_path=' or cfg='search_path=""'))
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname in
        ('create_pet_caregiver_invitation','revoke_pet_caregiver_invitation','preview_pet_caregiver_invitation',
         'accept_pet_caregiver_invitation','remove_pet_co_parent','leave_pet_as_co_parent','get_pet_coparent_state',
         'pet_invitation_hash','pet_invitation_normalize_code','pet_invitation_generate_code','pet_invitation_within_rate_limit')), false)

  union all
  select 'internal_helpers_not_client_executable',
    coalesce(
      not has_function_privilege('authenticated','public.pet_invitation_hash(text)','EXECUTE')
      and not has_function_privilege('authenticated','public.pet_invitation_generate_code()','EXECUTE')
      and not has_function_privilege('authenticated','public.pet_invitation_within_rate_limit(uuid)','EXECUTE')
      and not has_function_privilege('anon','public.pet_invitation_hash(text)','EXECUTE'),
      false)

  union all
  select 'invitation_rpcs_granted_authenticated_revoked_anon',
    coalesce(
      has_function_privilege('authenticated','public.create_pet_caregiver_invitation(uuid,text)','EXECUTE')
      and has_function_privilege('authenticated','public.preview_pet_caregiver_invitation(text,text)','EXECUTE')
      and has_function_privilege('authenticated','public.accept_pet_caregiver_invitation(text,text,text)','EXECUTE')
      and has_function_privilege('authenticated','public.remove_pet_co_parent(uuid,text)','EXECUTE')
      and has_function_privilege('authenticated','public.leave_pet_as_co_parent(uuid,text)','EXECUTE')
      and not has_function_privilege('anon','public.create_pet_caregiver_invitation(uuid,text)','EXECUTE')
      and not has_function_privilege('anon','public.accept_pet_caregiver_invitation(text,text,text)','EXECUTE'),
      false)

  union all
  select 'authenticated_cannot_write_invitation_tables',
    coalesce(
      not has_table_privilege('authenticated','public.pet_caregiver_invitations','INSERT')
      and not has_table_privilege('authenticated','public.pet_caregiver_invitations','UPDATE')
      and not has_table_privilege('authenticated','public.pet_caregiver_invitations','SELECT')
      and not has_table_privilege('authenticated','public.pet_invitation_attempts','INSERT')
      and not has_table_privilege('authenticated','public.pet_invitation_attempts','SELECT'),
      false)

  union all
  select 'invitation_tables_rls_enabled',
    coalesce((select bool_and(relrowsecurity) from pg_class
      where relname in ('pet_caregiver_invitations','pet_invitation_attempts')
        and relnamespace='public'::regnamespace), false)

  union all
  select 'leave_is_co_parent_only',
    coalesce((select pg_get_functiondef(p.oid) ilike '%role = ''co_parent''%'
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='leave_pet_as_co_parent'), false)

  union all
  select 'remove_is_owner_only',
    coalesce((select pg_get_functiondef(p.oid) ilike '%only owner%'
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname='public' and p.proname='remove_pet_co_parent'), false)

) as checks
order by check_name;
