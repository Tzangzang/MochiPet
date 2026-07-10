-- Verify: auth profiles foundation
-- Các câu SQL CHỈ ĐỌC để kiểm tra sau khi migration được áp dụng.
-- Không thay đổi dữ liệu. Không select dữ liệu nhạy cảm từ auth.users.

-- 1. Bảng public.profiles tồn tại?
select to_regclass('public.profiles') is not null as profiles_table_exists;

-- 2. RLS đã bật trên public.profiles?
select c.relname, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'profiles';

-- 3. Liệt kê policy của public.profiles
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'profiles'
order by policyname;

-- 4. Trigger on_auth_user_created tồn tại trên auth.users?
select t.tgname, c.relname as on_table
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where t.tgname = 'on_auth_user_created'
  and n.nspname = 'auth'
  and c.relname = 'users'
  and not t.tgisinternal;

-- 5. Function public.handle_new_user tồn tại?
select p.proname, p.prosecdef as security_definer
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'handle_new_user';

-- 6. Function public.set_updated_at tồn tại?
select p.proname
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'set_updated_at';

-- 7. Trigger set_profiles_updated_at tồn tại trên public.profiles? (bổ trợ)
select t.tgname, c.relname as on_table
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where t.tgname = 'set_profiles_updated_at'
  and n.nspname = 'public'
  and c.relname = 'profiles'
  and not t.tgisinternal;

-- 8. Kiểm tra quyền bảng: anon KHÔNG có quyền, authenticated có select/update
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'profiles'
order by grantee, privilege_type;


-- =========================================================================
-- HARDENING CHECKS (bổ sung sau migration 20260711013000)
-- Tất cả read-only. Không INSERT/UPDATE/DELETE/TRUNCATE/DDL.
-- =========================================================================

-- 9. anon KHÔNG có bất kỳ table privilege nào trên public.profiles
select
  not has_table_privilege('anon', 'public.profiles', 'SELECT')
  and not has_table_privilege('anon', 'public.profiles', 'INSERT')
  and not has_table_privilege('anon', 'public.profiles', 'UPDATE')
  and not has_table_privilege('anon', 'public.profiles', 'DELETE')
  and not has_table_privilege('anon', 'public.profiles', 'TRUNCATE')
  and not has_table_privilege('anon', 'public.profiles', 'REFERENCES')
  and not has_table_privilege('anon', 'public.profiles', 'TRIGGER')
  as anon_has_no_privileges;

-- 10. authenticated CÓ quyền SELECT
select has_table_privilege('authenticated', 'public.profiles', 'SELECT')
  as authenticated_can_select;

-- 11. authenticated CÓ quyền UPDATE
select has_table_privilege('authenticated', 'public.profiles', 'UPDATE')
  as authenticated_can_update;

-- 12. authenticated KHÔNG có quyền dư thừa (INSERT/DELETE/TRUNCATE/REFERENCES/TRIGGER)
select
  not has_table_privilege('authenticated', 'public.profiles', 'INSERT')
  and not has_table_privilege('authenticated', 'public.profiles', 'DELETE')
  and not has_table_privilege('authenticated', 'public.profiles', 'TRUNCATE')
  and not has_table_privilege('authenticated', 'public.profiles', 'REFERENCES')
  and not has_table_privilege('authenticated', 'public.profiles', 'TRIGGER')
  as authenticated_has_no_excess_privileges;

-- 13. anon KHÔNG có EXECUTE trực tiếp trên các trigger function
select
  not has_function_privilege('anon', 'public.handle_new_user()', 'EXECUTE')
  and not has_function_privilege('anon', 'public.set_updated_at()', 'EXECUTE')
  as anon_cannot_execute_trigger_functions;

-- 14. authenticated KHÔNG có EXECUTE trực tiếp trên các trigger function
select
  not has_function_privilege('authenticated', 'public.handle_new_user()', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.set_updated_at()', 'EXECUTE')
  as authenticated_cannot_execute_trigger_functions;

-- 15. postgres và service_role KHÔNG bị thay đổi ngoài ý muốn (vẫn giữ quyền)
select
  has_table_privilege('service_role', 'public.profiles', 'SELECT')
  and has_table_privilege('service_role', 'public.profiles', 'INSERT')
  and has_table_privilege('service_role', 'public.profiles', 'UPDATE')
  and has_table_privilege('service_role', 'public.profiles', 'DELETE')
  as service_role_still_has_privileges;

select
  has_table_privilege('postgres', 'public.profiles', 'SELECT')
  and has_table_privilege('postgres', 'public.profiles', 'INSERT')
  and has_table_privilege('postgres', 'public.profiles', 'UPDATE')
  and has_table_privilege('postgres', 'public.profiles', 'DELETE')
  as postgres_still_has_privileges;
