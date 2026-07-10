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
