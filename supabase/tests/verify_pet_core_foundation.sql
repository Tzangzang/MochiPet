-- Verify: Pet Core foundation
-- Chỉ read-only (SELECT). Không thay đổi dữ liệu. Chạy sau khi áp migration.

-- 1. Năm bảng mới tồn tại
select
  to_regclass('public.pet_species') is not null
  and to_regclass('public.eggs') is not null
  and to_regclass('public.pets') is not null
  and to_regclass('public.pet_caregivers') is not null
  and to_regclass('public.pet_feeding_logs') is not null
  as all_five_tables_exist;

-- 2. RLS bật trên tất cả 5 bảng
select bool_and(c.relrowsecurity) as rls_enabled_on_all
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('pet_species', 'eggs', 'pets', 'pet_caregivers', 'pet_feeding_logs');

-- 3. Policy trên từng bảng (liệt kê) + chỉ có SELECT policy
select tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
  and tablename in ('pet_species', 'eggs', 'pets', 'pet_caregivers', 'pet_feeding_logs')
order by tablename, policyname;

select bool_and(cmd = 'SELECT') as all_policies_are_select_only
from pg_policies
where schemaname = 'public'
  and tablename in ('pet_species', 'eggs', 'pets', 'pet_caregivers', 'pet_feeding_logs');

-- 4. authenticated CHỈ có SELECT (không INSERT/UPDATE/DELETE)
select
  bool_and(has_table_privilege('authenticated', 'public.' || t, 'SELECT'))
  and not bool_or(has_table_privilege('authenticated', 'public.' || t, 'INSERT'))
  and not bool_or(has_table_privilege('authenticated', 'public.' || t, 'UPDATE'))
  and not bool_or(has_table_privilege('authenticated', 'public.' || t, 'DELETE'))
  as authenticated_select_only
from unnest(array['pet_species', 'eggs', 'pets', 'pet_caregivers', 'pet_feeding_logs']) as t;

-- 5. anon KHÔNG có quyền nào
select not bool_or(
  has_table_privilege('anon', 'public.' || t, 'SELECT')
  or has_table_privilege('anon', 'public.' || t, 'INSERT')
  or has_table_privilege('anon', 'public.' || t, 'UPDATE')
  or has_table_privilege('anon', 'public.' || t, 'DELETE')
) as anon_has_no_privileges
from unnest(array['pet_species', 'eggs', 'pets', 'pet_caregivers', 'pet_feeding_logs']) as t;

-- 6. Partial unique index cho single active owner tồn tại
select exists (
  select 1 from pg_indexes
  where schemaname = 'public' and indexname = 'pet_caregivers_one_active_owner'
) as owner_partial_unique_index_exists;

-- 7. Trigger giới hạn 2 caregivers tồn tại
select exists (
  select 1
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'pet_caregivers'
    and t.tgname = 'trg_enforce_max_two_caregivers'
    and not t.tgisinternal
) as caregiver_limit_trigger_exists;

-- 8. Updated-at triggers tồn tại (đủ 4)
select count(*) = 4 as updated_at_triggers_exist
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and not t.tgisinternal
  and t.tgname in (
    'set_pet_species_updated_at',
    'set_eggs_updated_at',
    'set_pets_updated_at',
    'set_pet_caregivers_updated_at'
  );

-- 9. Function is_active_pet_caregiver tồn tại (security definer)
select
  bool_or(p.prosecdef) as helper_function_exists_secdef
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'is_active_pet_caregiver';

-- 10. Không có dữ liệu seed ngoài ý muốn (mọi bảng rỗng)
select
  (select count(*) from public.pet_species) = 0
  and (select count(*) from public.eggs) = 0
  and (select count(*) from public.pets) = 0
  and (select count(*) from public.pet_caregivers) = 0
  and (select count(*) from public.pet_feeding_logs) = 0
  as no_seed_data;

-- 11. Các check constraint quan trọng tồn tại
select bool_and(
  exists (
    select 1
    from pg_constraint con
    join pg_namespace n on n.oid = con.connamespace
    where n.nspname = 'public' and con.conname = w.conname and con.contype = 'c'
  )
) as key_check_constraints_exist
from (values
  ('pets_status_valid'),
  ('pets_dead_died_at'),
  ('pets_state_version_valid'),
  ('eggs_status_valid'),
  ('eggs_incubating_times'),
  ('eggs_hatched_at_presence'),
  ('eggs_species_required'),
  ('pet_caregivers_role_valid'),
  ('pet_caregivers_left_at_rule'),
  ('pet_feeding_logs_life_status_valid')
) as w(conname);

-- 12. KHÔNG tạo bảng invitation/inventory/payment/notification/food (ngoài scope)
select not exists (
  select 1 from information_schema.tables
  where table_schema = 'public'
    and table_name in (
      'coop_invites', 'invitations', 'inventory_items', 'item_catalog',
      'purchases', 'subscriptions', 'notifications',
      'food_catalog', 'food_categories'
    )
) as no_out_of_scope_tables;


-- =========================================================================
-- CONCURRENCY HARDENING CHECKS (bổ sung ở Phase 4 Bước 1.1)
-- =========================================================================

-- 13. Trigger caregiver là BEFORE và áp dụng cho cả INSERT lẫn UPDATE.
--     tgtype bit: 2 = BEFORE, 4 = INSERT, 16 = UPDATE.
select
  bool_or((t.tgtype & 2) <> 0) as caregiver_trigger_is_before,
  bool_or((t.tgtype & 2) = 0) as caregiver_trigger_has_after_row,
  bool_or((t.tgtype & 4) <> 0) as caregiver_trigger_on_insert,
  bool_or((t.tgtype & 16) <> 0) as caregiver_trigger_on_update
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'pet_caregivers'
  and t.tgname = 'trg_enforce_max_two_caregivers'
  and not t.tgisinternal;

-- 14. Function giới hạn caregiver tồn tại.
select exists (
  select 1 from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'enforce_max_two_caregivers'
) as caregiver_limit_function_exists;

-- 15. Source function có row lock FOR UPDATE trên public.pets (best-effort qua catalog).
select
  pg_get_functiondef(p.oid) ilike '%for update%'
  and pg_get_functiondef(p.oid) ilike '%public.pets%'
  as caregiver_function_has_pets_row_lock
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'enforce_max_two_caregivers';

-- 16. Partial unique index single active owner vẫn tồn tại (không đổi).
select exists (
  select 1 from pg_indexes
  where schemaname = 'public' and indexname = 'pet_caregivers_one_active_owner'
) as owner_partial_unique_index_still_exists;

-- 17. Chưa có RPC feed/hatch/perform và không có function scheduled/cron trong public.
select not exists (
  select 1 from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname ~ '(feed|hatch|perform|scheduled|cron)'
) as no_feed_hatch_or_scheduled_functions;

-- 18. Liệt kê function trong public (kỳ vọng CHỈ: set_updated_at, handle_new_user,
--     enforce_max_two_caregivers, is_active_pet_caregiver).
select array_agg(p.proname order by p.proname) as public_functions
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public';

-- LƯU Ý (static review): việc "không có scheduled job/cron" được xác nhận bằng
-- static review — migration này không tạo bất kỳ cron.schedule/pg_cron job nào.
-- Không kiểm tra cron.job bằng SQL vì pg_cron có thể đã được bật sẵn ở project
-- (sự tồn tại của cron.job không đồng nghĩa migration này tạo job).


-- =========================================================================
-- IMMUTABILITY CHECKS (bổ sung ở Phase 4 Bước 1.2)
-- =========================================================================

-- 19. Trigger vẫn là BEFORE + INSERT + UPDATE (không đổi).
select
  bool_or((t.tgtype & 2) <> 0) as trigger_is_before,
  bool_or((t.tgtype & 4) <> 0) as trigger_on_insert,
  bool_or((t.tgtype & 16) <> 0) as trigger_on_update
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'pet_caregivers'
  and t.tgname = 'trg_enforce_max_two_caregivers'
  and not t.tgisinternal;

-- 20. Source function có guard bất biến: kiểm tra OLD.pet_id, OLD.user_id,
--     IS DISTINCT FROM, và row lock FOR UPDATE vẫn còn (best-effort qua catalog).
select
  pg_get_functiondef(p.oid) ilike '%old.pet_id%' as checks_old_pet_id,
  pg_get_functiondef(p.oid) ilike '%old.user_id%' as checks_old_user_id,
  pg_get_functiondef(p.oid) ilike '%is distinct from%' as uses_is_distinct_from,
  pg_get_functiondef(p.oid) ilike '%for update%' as has_row_lock,
  pg_get_functiondef(p.oid) ilike '%public.pets%' as locks_public_pets
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'enforce_max_two_caregivers';

-- 21. Partial unique index single active owner vẫn tồn tại (không đổi).
select exists (
  select 1 from pg_indexes
  where schemaname = 'public' and indexname = 'pet_caregivers_one_active_owner'
) as owner_partial_unique_index_intact;
