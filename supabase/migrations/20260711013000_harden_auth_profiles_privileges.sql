-- Migration: harden_auth_profiles_privileges
-- Mục đích: siết quyền bảng public.profiles về đúng thiết kế đã duyệt.
--
-- Bối cảnh: sau khi áp migration nền, role `authenticated` (qua default
-- privileges của Supabase) đang có dư quyền: INSERT, DELETE, TRUNCATE,
-- REFERENCES, TRIGGER. Thiết kế chỉ cho phép SELECT + UPDATE.
--
-- Không sửa migration đã áp trước đó (20260711010000). Không đổi bảng/policy,
-- không xóa dữ liệu, không đụng auth.users, không dùng CASCADE.
--
-- Lưu ý: trigger on_auth_user_created và set_profiles_updated_at VẪN hoạt động
-- sau khi thu hồi EXECUTE trực tiếp — PostgreSQL không kiểm tra quyền EXECUTE
-- của role gọi khi kích hoạt trigger function; handle_new_user còn là SECURITY
-- DEFINER nên chạy dưới quyền owner.

begin;

-- 1. Thu hồi toàn bộ quyền bảng của anon và authenticated.
revoke all privileges
  on table public.profiles
  from anon;

revoke all privileges
  on table public.profiles
  from authenticated;

-- 2. Cấp lại đúng quyền tối thiểu cho authenticated.
grant select, update
  on table public.profiles
  to authenticated;

-- 3. Thu hồi EXECUTE trực tiếp trên các trigger function khỏi PUBLIC/anon/authenticated.
revoke execute
  on function public.handle_new_user()
  from public, anon, authenticated;

revoke execute
  on function public.set_updated_at()
  from public, anon, authenticated;

commit;

-- Không thu hồi quyền của postgres hoặc service_role (giữ nguyên quyền quản trị).
--
-- Rollback thủ công (KHÔNG tự chạy):
--   -- Cấp lại như trạng thái default trước hardening (nếu thật sự cần):
--   -- grant execute on function public.handle_new_user() to public;
--   -- grant execute on function public.set_updated_at() to public;
--   -- (Không khuyến nghị cấp lại INSERT/DELETE/... cho authenticated.)
