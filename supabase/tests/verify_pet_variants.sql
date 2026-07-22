select check_name, passed
from (

  select 'pet_variants_table_exists'::text as check_name,
    coalesce((select exists (select 1 from information_schema.tables
      where table_schema='public' and table_name='pet_variants')), false) as passed

  union all
  select 'exactly_30_records',
    coalesce((select count(*) = 30 from public.pet_variants), false)

  union all
  select 'no_record_beyond_30',
    coalesce((select max(sort_order) = 30 and min(sort_order) = 1 and count(distinct sort_order) = 30 from public.pet_variants), false)

  union all
  select 'code_unique_constraint',
    coalesce((select count(*) >= 1 from pg_constraint where conrelid='public.pet_variants'::regclass and contype='u' and pg_get_constraintdef(oid) ilike '%code%'), false)

  union all
  select 'image_path_unique_constraint',
    coalesce((select count(*) >= 1 from pg_constraint where conrelid='public.pet_variants'::regclass and contype='u' and pg_get_constraintdef(oid) ilike '%image_path%'), false)

  union all
  select 'sort_order_unique_constraint',
    coalesce((select count(*) >= 1 from pg_constraint where conrelid='public.pet_variants'::regclass and contype='u' and pg_get_constraintdef(oid) ilike '%sort_order%'), false)

  union all
  select 'all_image_paths_local_catalog',
    coalesce((select bool_and(image_path like '/pets/catalog/%') from public.pet_variants), false)

  union all
  select 'no_absolute_urls',
    coalesce((select bool_and(image_path not ilike 'http%' and image_path not ilike '%/Users/%') from public.pet_variants), false)

  union all
  select 'group_common_rarity_and_weight',
    coalesce((select bool_and(rarity='common' and weight=100 and rarity_label='Rất dễ nở') from public.pet_variants where sort_order between 1 and 12), false)

  union all
  select 'group_uncommon_rarity_and_weight',
    coalesce((select bool_and(rarity='uncommon' and weight=60 and rarity_label='Bình thường') from public.pet_variants where sort_order between 13 and 18), false)

  union all
  select 'group_rare_rarity_and_weight',
    coalesce((select bool_and(rarity='rare' and weight=20 and rarity_label='Hiếm') from public.pet_variants where sort_order between 19 and 24), false)

  union all
  select 'group_ultra_rare_rarity_and_weight',
    coalesce((select bool_and(rarity='ultra_rare' and weight=5 and rarity_label='Siêu hiếm') from public.pet_variants where sort_order between 25 and 30), false)

  union all
  select 'total_weight_is_1710',
    coalesce((select sum(weight) = 1710 from public.pet_variants), false)

  union all
  select 'rarity_check_constraint',
    coalesce((select pg_get_constraintdef(oid) ilike '%common%' and pg_get_constraintdef(oid) ilike '%ultra_rare%'
      from pg_constraint where conrelid='public.pet_variants'::regclass and conname='pet_variants_rarity_valid'), false)

  union all
  select 'weight_positive_constraint',
    coalesce((select pg_get_constraintdef(oid) ilike '%weight > 0%'
      from pg_constraint where conrelid='public.pet_variants'::regclass and conname='pet_variants_weight_positive'), false)

  union all
  select 'sort_order_range_constraint',
    coalesce((select exists (select 1 from pg_constraint where conrelid='public.pet_variants'::regclass and conname='pet_variants_sort_order_range')), false)

  union all
  select 'image_path_prefix_constraint',
    coalesce((select pg_get_constraintdef(oid) ilike '%/pets/catalog/%'
      from pg_constraint where conrelid='public.pet_variants'::regclass and conname='pet_variants_image_path_prefix'), false)

  union all
  select 'pets_has_variant_id_column',
    coalesce((select exists (select 1 from information_schema.columns
      where table_schema='public' and table_name='pets' and column_name='variant_id')), false)

  union all
  select 'pets_variant_id_foreign_key',
    coalesce((select exists (select 1 from pg_constraint
      where conrelid='public.pets'::regclass and contype='f'
        and pg_get_constraintdef(oid) ilike '%variant_id%' and pg_get_constraintdef(oid) ilike '%pet_variants%')), false)

  union all
  select 'pets_variant_id_index',
    coalesce((select exists (select 1 from pg_indexes where schemaname='public' and indexname='pets_variant_id_idx')), false)

  union all
  select 'eggs_have_no_variant_column',
    coalesce(not exists (select 1 from information_schema.columns
      where table_schema='public' and table_name='eggs' and column_name='variant_id'), false)

  union all
  select 'all_pets_have_variant',
    coalesce((select count(*) filter (where variant_id is null) = 0 from public.pets), false)

  union all
  select 'existing_pets_match_fnv_mapping',
    coalesce((select bool_and(
      v.sort_order = public.pet_variant_fnv_index(p.id::text) + 1
    ) from public.pets p join public.pet_variants v on v.id = p.variant_id), false)

  union all
  select 'hatch_selects_enabled_and_weight',
    coalesce((select pg_get_functiondef(pr.oid) ilike '%is_enabled = true%' and pg_get_functiondef(pr.oid) ilike '%weight > 0%'
      from pg_proc pr join pg_namespace n on n.oid=pr.pronamespace
      where n.nspname='public' and pr.proname='hatch_egg'), false)

  union all
  select 'hatch_weighted_cumulative',
    coalesce((select pg_get_functiondef(pr.oid) ilike '%sum(weight) over%' and pg_get_functiondef(pr.oid) ilike '%random()%'
      from pg_proc pr join pg_namespace n on n.oid=pr.pronamespace
      where n.nspname='public' and pr.proname='hatch_egg'), false)

  union all
  select 'hatch_signature_unchanged_no_client_variant',
    coalesce((select bool_or(pg_get_function_arguments(pr.oid)='p_egg_id uuid, p_pet_name text, p_idempotency_key text')
      from pg_proc pr join pg_namespace n on n.oid=pr.pronamespace
      where n.nspname='public' and pr.proname='hatch_egg'), false)

  union all
  select 'hatch_persists_variant_and_replays',
    coalesce((select pg_get_functiondef(pr.oid) ilike '%variant_id%' and pg_get_functiondef(pr.oid) ilike '%variant_code%'
      and pg_get_functiondef(pr.oid) ilike '%pet_core_requests%'
      from pg_proc pr join pg_namespace n on n.oid=pr.pronamespace
      where n.nspname='public' and pr.proname='hatch_egg'), false)

  union all
  select 'room_state_returns_variant_fields',
    coalesce((select
      pg_get_functiondef(pr.oid) ilike '%variant_id uuid%'
      and pg_get_functiondef(pr.oid) ilike '%variant_image_path text%'
      and pg_get_functiondef(pr.oid) ilike '%variant_rarity text%'
      and pg_get_functiondef(pr.oid) ilike '%variant_rarity_label text%'
      from pg_proc pr join pg_namespace n on n.oid=pr.pronamespace
      where n.nspname='public' and pr.proname='get_pet_room_state'), false)

  union all
  select 'pet_variants_rls_enabled',
    coalesce((select relrowsecurity from pg_class where relname='pet_variants' and relnamespace='public'::regnamespace), false)

  union all
  select 'authenticated_cannot_write_pet_variants',
    coalesce(
      not has_table_privilege('authenticated','public.pet_variants','INSERT')
      and not has_table_privilege('authenticated','public.pet_variants','UPDATE')
      and not has_table_privilege('authenticated','public.pet_variants','DELETE')
      and not has_table_privilege('authenticated','public.pet_variants','SELECT'),
      false)

  union all
  select 'authenticated_cannot_update_pets',
    coalesce(
      not has_table_privilege('authenticated','public.pets','UPDATE')
      and not has_table_privilege('authenticated','public.pets','INSERT'),
      false)

  union all
  select 'variant_functions_safe_search_path',
    coalesce((select bool_and(exists (select 1 from unnest(pr.proconfig) cfg where cfg='search_path=' or cfg='search_path=""'))
      from pg_proc pr join pg_namespace n on n.oid=pr.pronamespace
      where n.nspname='public' and pr.proname in ('hatch_egg','get_pet_room_state','pet_variant_fnv_index')), false)

  union all
  select 'variant_rpc_grants_correct',
    coalesce(
      has_function_privilege('authenticated','public.hatch_egg(uuid,text,text)','EXECUTE')
      and has_function_privilege('authenticated','public.get_pet_room_state(uuid,text)','EXECUTE')
      and not has_function_privilege('anon','public.hatch_egg(uuid,text,text)','EXECUTE')
      and not has_function_privilege('authenticated','public.pet_variant_fnv_index(text)','EXECUTE'),
      false)

  union all
  select 'display_names_match_frontend_group',
    coalesce((select
      (select display_name from public.pet_variants where sort_order=1) = 'Mèo'
      and (select display_name from public.pet_variants where sort_order=24) = 'Cá heo'
      and (select display_name from public.pet_variants where sort_order=30) = 'Tinh linh mầm cây'), false)

) as checks
order by check_name;
