-- Migration: create_auth_profiles
-- Mục đích: nền tảng authentication.
--   * public.profiles liên kết 1-1 với auth.users
--   * tự động tạo profile khi user signup (email/password hoặc Google)
--   * trigger cập nhật updated_at
--   * bật Row Level Security, user chỉ đọc/sửa profile của chính mình
--
-- KHÔNG lưu email/password trong public.profiles. Email và identity tiếp tục
-- do Supabase Auth quản lý trong auth.users.
-- KHÔNG tạo bảng pet/egg/co-op/gameplay trong migration này.


-- =========================================================================
-- 1. Bảng public.profiles
-- =========================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  timezone text not null default 'UTC',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- display_name nếu có: trim không rỗng, tối đa 80 ký tự
  constraint profiles_display_name_valid check (
    display_name is null
    or char_length(btrim(display_name)) between 1 and 80
  ),
  -- avatar_url nếu có: tối đa 2048 ký tự
  constraint profiles_avatar_url_len check (
    avatar_url is null or char_length(avatar_url) <= 2048
  ),
  -- timezone: trim không rỗng, tối đa 100 ký tự
  constraint profiles_timezone_valid check (
    char_length(btrim(timezone)) between 1 and 100
  )
);


-- =========================================================================
-- 2. Function + trigger cập nhật updated_at
-- =========================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();


-- =========================================================================
-- 3. Function + trigger tạo profile khi có user mới
-- =========================================================================
-- security definer + search_path = '' -> chỉ dùng tên đã qualify đầy đủ.
-- Không đọc/lưu password, access token hay provider token.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_display_name text;
  v_avatar_url text;
  v_timezone text;
begin
  -- display_name: giá trị đầu tiên có sẵn theo thứ tự ưu tiên
  v_display_name := coalesce(
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    split_part(coalesce(new.email, ''), '@', 1)
  );
  -- sanitize: trim, rỗng -> null, giới hạn 80 ký tự
  v_display_name := nullif(btrim(v_display_name), '');
  if v_display_name is not null then
    v_display_name := left(v_display_name, 80);
  end if;

  -- avatar_url: giá trị đầu tiên có sẵn, giới hạn 2048 ký tự
  v_avatar_url := coalesce(
    new.raw_user_meta_data ->> 'avatar_url',
    new.raw_user_meta_data ->> 'picture'
  );
  if v_avatar_url is not null then
    v_avatar_url := left(v_avatar_url, 2048);
  end if;

  -- timezone: dùng metadata nếu không rỗng, ngược lại 'UTC'; giới hạn 100 ký tự
  v_timezone := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'timezone', '')), '');
  v_timezone := coalesce(left(v_timezone, 100), 'UTC');

  insert into public.profiles (id, display_name, avatar_url, timezone)
  values (new.id, v_display_name, v_avatar_url, v_timezone)
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Trigger trên auth.users (drop-if-exists để migration chạy ổn định ở dev).
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();


-- =========================================================================
-- 4. Row Level Security + quyền
-- =========================================================================
alter table public.profiles enable row level security;

-- Không cấp quyền cho anon. Thu hồi mọi quyền bảng của anon cho chắc chắn.
revoke all on public.profiles from anon;

-- Chỉ cấp quyền cần thiết cho authenticated.
-- INSERT do trigger đảm nhiệm; không cấp INSERT/DELETE trực tiếp.
grant select, update on public.profiles to authenticated;

-- Policy (drop-if-exists để idempotent trong dev)
drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() is not null and auth.uid() = profiles.id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() is not null and auth.uid() = profiles.id)
  with check (auth.uid() is not null and auth.uid() = profiles.id);


-- =========================================================================
-- 5. Comments (tài liệu schema)
-- =========================================================================
comment on table public.profiles is
  'Hồ sơ người dùng (1-1 với auth.users). Không lưu email/password; identity do auth.users quản lý.';
comment on column public.profiles.id is
  'Khóa chính, tham chiếu auth.users(id), on delete cascade.';
comment on column public.profiles.display_name is
  'Tên hiển thị (nullable). Nếu có: đã trim, không rỗng, tối đa 80 ký tự.';
comment on column public.profiles.avatar_url is
  'URL ảnh đại diện (nullable). Tối đa 2048 ký tự.';
comment on column public.profiles.timezone is
  'Múi giờ IANA của người dùng. Mặc định UTC; không rỗng, tối đa 100 ký tự.';
comment on column public.profiles.onboarding_completed is
  'Đánh dấu người dùng đã hoàn tất onboarding hay chưa.';


-- =========================================================================
-- Rollback thủ công (KHÔNG chạy tự động — xóa có kiểm soát khi thật sự cần):
-- =========================================================================
--   drop trigger if exists on_auth_user_created on auth.users;
--   drop trigger if exists set_profiles_updated_at on public.profiles;
--   drop function if exists public.handle_new_user();
--   drop function if exists public.set_updated_at();
--   drop table if exists public.profiles;   -- CẢNH BÁO: xóa toàn bộ profile
-- Lưu ý: tuyệt đối KHÔNG drop/delete auth.users.
