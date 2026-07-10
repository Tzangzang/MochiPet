-- Verify: Pet Core foundation (consolidated)
-- Một result set duy nhất: (check_name text, passed boolean), mỗi kiểm tra là 1 hàng.
-- Hoàn toàn read-only (chỉ SELECT). Không INSERT/UPDATE/DELETE/DDL, không đổi dữ liệu.
-- Chạy sau khi áp migration. Mọi biểu thức bọc coalesce(...,false) để passed không null.

select check_name, passed
from (

  -- Năm bảng mới tồn tại
  select 'all_five_tables_exist'::text as check_name,
    coalesce(
      to_regclass('public.pet_species') is not null
      and to_regclass('public.eggs') is not null
      and to_regclass('public.pets') is not null
      and to_regclass('public.pet_caregivers') is not null
      and to_regclass('public.pet_feeding_logs') is not null,
      false
    ) as passed

  union all
  -- RLS bật trên cả 5 bảng
  select 'rls_enabled_on_all',
    coalesce((
      select bool_and(c.relrowsecurity)
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname in ('pet_species', 'eggs', 'pets', 'pet_caregivers', 'pet_feeding_logs')
    ), false)

  union all
  -- Mọi policy trên các bảng này chỉ là SELECT
  select 'all_policies_are_select_only',
    coalesce((
      select bool_and(cmd = 'SELECT')
      from pg_policies
      where schemaname = 'public'
        and tablename in ('pet_species', 'eggs', 'pets', 'pet_caregivers', 'pet_feeding_logs')
    ), false)

  union all
  -- authenticated CHỈ có SELECT (không INSERT/UPDATE/DELETE)
  select 'authenticated_select_only',
    coalesce((
      select bool_and(has_table_privilege('authenticated', 'public.' || t, 'SELECT'))
        and not bool_or(has_table_privilege('authenticated', 'public.' || t, 'INSERT'))
        and not bool_or(has_table_privilege('authenticated', 'public.' || t, 'UPDATE'))
        and not bool_or(has_table_privilege('authenticated', 'public.' || t, 'DELETE'))
      from unnest(array['pet_species', 'eggs', 'pets', 'pet_caregivers', 'pet_feeding_logs']) as t
    ), false)

  union all
  -- anon KHÔNG có quyền nào
  select 'anon_has_no_privileges',
    coalesce((
      select not bool_or(
        has_table_privilege('anon', 'public.' || t, 'SELECT')
        or has_table_privilege('anon', 'public.' || t, 'INSERT')
        or has_table_privilege('anon', 'public.' || t, 'UPDATE')
        or has_table_privilege('anon', 'public.' || t, 'DELETE')
      )
      from unnest(array['pet_species', 'eggs', 'pets', 'pet_caregivers', 'pet_feeding_logs']) as t
    ), false)

  union all
  -- Partial unique index single active owner còn nguyên
  select 'owner_partial_unique_index_intact',
    coalesce(exists (
      select 1 from pg_indexes
      where schemaname = 'public' and indexname = 'pet_caregivers_one_active_owner'
    ), false)

  union all
  -- Trigger giới hạn caregiver tồn tại
  select 'caregiver_limit_trigger_exists',
    coalesce(exists (
      select 1
      from pg_trigger t
      join pg_class c on c.oid = t.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = 'pet_caregivers'
        and t.tgname = 'trg_enforce_max_two_caregivers'
        and not t.tgisinternal
    ), false)

  union all
  -- Trigger là BEFORE (tgtype bit 2)
  select 'caregiver_trigger_is_before',
    coalesce((
      select bool_or((t.tgtype & 2) <> 0)
      from pg_trigger t
      join pg_class c on c.oid = t.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = 'pet_caregivers'
        and t.tgname = 'trg_enforce_max_two_caregivers' and not t.tgisinternal
    ), false)

  union all
  -- Trigger áp dụng INSERT (tgtype bit 4)
  select 'caregiver_trigger_on_insert',
    coalesce((
      select bool_or((t.tgtype & 4) <> 0)
      from pg_trigger t
      join pg_class c on c.oid = t.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = 'pet_caregivers'
        and t.tgname = 'trg_enforce_max_two_caregivers' and not t.tgisinternal
    ), false)

  union all
  -- Trigger áp dụng UPDATE (tgtype bit 16)
  select 'caregiver_trigger_on_update',
    coalesce((
      select bool_or((t.tgtype & 16) <> 0)
      from pg_trigger t
      join pg_class c on c.oid = t.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = 'pet_caregivers'
        and t.tgname = 'trg_enforce_max_two_caregivers' and not t.tgisinternal
    ), false)

  union all
  -- Function có row lock FOR UPDATE trên public.pets (best-effort qua catalog)
  select 'caregiver_function_has_pets_row_lock',
    coalesce((
      select pg_get_functiondef(p.oid) ilike '%for update%'
        and pg_get_functiondef(p.oid) ilike '%public.pets%'
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'enforce_max_two_caregivers'
    ), false)

  union all
  -- Membership identity bất biến: function kiểm tra OLD.pet_id/OLD.user_id + IS DISTINCT FROM
  select 'caregiver_membership_identity_immutable',
    coalesce((
      select pg_get_functiondef(p.oid) ilike '%old.pet_id%'
        and pg_get_functiondef(p.oid) ilike '%old.user_id%'
        and pg_get_functiondef(p.oid) ilike '%is distinct from%'
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'enforce_max_two_caregivers'
    ), false)

  union all
  -- Đủ 4 updated_at triggers
  select 'updated_at_triggers_exist',
    coalesce((
      select count(*) = 4
      from pg_trigger t
      join pg_class c on c.oid = t.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and not t.tgisinternal
        and t.tgname in (
          'set_pet_species_updated_at', 'set_eggs_updated_at',
          'set_pets_updated_at', 'set_pet_caregivers_updated_at'
        )
    ), false)

  union all
  -- Helper function is_active_pet_caregiver tồn tại và là security definer
  select 'helper_function_exists',
    coalesce((
      select bool_or(p.prosecdef)
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'is_active_pet_caregiver'
    ), false)

  union all
  -- Các check constraint quan trọng tồn tại
  select 'key_check_constraints_exist',
    coalesce((
      select bool_and(
        exists (
          select 1
          from pg_constraint con
          join pg_namespace n on n.oid = con.connamespace
          where n.nspname = 'public' and con.conname = w.conname and con.contype = 'c'
        )
      )
      from (values
        ('pets_status_valid'), ('pets_dead_died_at'), ('pets_state_version_valid'),
        ('eggs_status_valid'), ('eggs_incubating_times'), ('eggs_hatched_at_presence'),
        ('eggs_species_required'), ('pet_caregivers_role_valid'),
        ('pet_caregivers_left_at_rule'), ('pet_feeding_logs_life_status_valid')
      ) as w(conname)
    ), false)

  union all
  -- Không có dữ liệu seed ngoài ý muốn (mọi bảng rỗng)
  select 'no_seed_data',
    coalesce(
      (select count(*) from public.pet_species) = 0
      and (select count(*) from public.eggs) = 0
      and (select count(*) from public.pets) = 0
      and (select count(*) from public.pet_caregivers) = 0
      and (select count(*) from public.pet_feeding_logs) = 0,
      false
    )

  union all
  -- Không tạo bảng invitation/inventory/payment/notification/food (ngoài scope)
  select 'no_out_of_scope_tables',
    coalesce(not exists (
      select 1 from information_schema.tables
      where table_schema = 'public'
        and table_name in (
          'coop_invites', 'invitations', 'inventory_items', 'item_catalog',
          'purchases', 'subscriptions', 'notifications',
          'food_catalog', 'food_categories'
        )
    ), false)

  union all
  -- Chưa có RPC feed/hatch/perform và không có function scheduled/cron trong public
  select 'no_feed_hatch_or_scheduled_functions',
    coalesce(not exists (
      select 1 from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname ~ '(feed|hatch|perform|scheduled|cron)'
    ), false)

) as checks
order by check_name;

-- LƯU Ý (static review): "không có scheduled job/cron" được xác nhận bằng static
-- review — migration này không tạo cron.schedule/pg_cron job nào. Không kiểm tra
-- cron.job bằng SQL vì pg_cron có thể đã bật sẵn ở project (sự tồn tại của
-- cron.job không đồng nghĩa migration này tạo job).
