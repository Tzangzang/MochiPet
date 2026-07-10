-- Migration: create_pet_core_foundation
-- Database foundation cho Pet Core: egg, pet, caregiver (co-op 2 người),
-- feeding history, và vòng đời sống/chết tính theo SERVER TIME.
--
-- KHÔNG tạo: invitation, inventory, food catalog, notification, payment, RPC.
-- KHÔNG seed species (artwork/danh sách pet chưa duyệt).
-- KHÔNG sửa migration đã áp trước đó. Không client-side insert (chỉ SELECT qua RLS).

begin;

-- =========================================================================
-- 1. pet_species (catalog loài — dữ liệu tĩnh, chưa seed)
-- =========================================================================
create table public.pet_species (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  display_name text not null,
  asset_key text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint pet_species_code_valid check (
    code = lower(code)
    and char_length(btrim(code)) between 1 and 50
    and code ~ '^[a-z0-9_]+$'
  ),
  constraint pet_species_display_name_valid check (
    char_length(btrim(display_name)) between 1 and 80
  ),
  constraint pet_species_asset_key_valid check (
    char_length(btrim(asset_key)) between 1 and 200
  )
);

-- =========================================================================
-- 2. eggs
-- =========================================================================
create table public.eggs (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  species_id uuid references public.pet_species (id) on delete restrict,
  status text not null default 'unhatched',
  hatch_started_at timestamptz,
  hatches_at timestamptz,
  hatched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint eggs_status_valid check (
    status in ('unhatched', 'incubating', 'hatched', 'cancelled')
  ),
  -- incubating phải có hatch_started_at và hatches_at
  constraint eggs_incubating_times check (
    status <> 'incubating'
    or (hatch_started_at is not null and hatches_at is not null)
  ),
  -- hatches_at phải lớn hơn hatch_started_at (khi cả hai có mặt)
  constraint eggs_hatch_window check (
    hatch_started_at is null
    or hatches_at is null
    or hatches_at > hatch_started_at
  ),
  -- hatched phải có hatched_at; chưa hatched thì hatched_at null
  constraint eggs_hatched_at_presence check (
    (status = 'hatched' and hatched_at is not null)
    or (status <> 'hatched' and hatched_at is null)
  ),
  -- species bắt buộc khi incubating hoặc hatched
  constraint eggs_species_required check (
    status not in ('incubating', 'hatched') or species_id is not null
  )
);

create index eggs_owner_user_id_idx on public.eggs (owner_user_id);
create index eggs_status_idx on public.eggs (status);
create index eggs_hatches_at_idx on public.eggs (hatches_at);

-- =========================================================================
-- 3. pets
--   Trạng thái đói KHÔNG lưu thành cột — tính động từ (server_now - last_fed_at).
-- =========================================================================
create table public.pets (
  id uuid primary key default gen_random_uuid(),
  egg_id uuid unique references public.eggs (id) on delete set null,
  species_id uuid not null references public.pet_species (id) on delete restrict,
  name text not null,
  status text not null default 'active',
  last_fed_at timestamptz not null default now(),
  died_at timestamptz,
  state_version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint pets_name_valid check (char_length(btrim(name)) between 1 and 40),
  constraint pets_status_valid check (status in ('active', 'dead')),
  constraint pets_state_version_valid check (state_version >= 1),
  constraint pets_dead_died_at check (
    (status = 'dead' and died_at is not null)
    or (status = 'active' and died_at is null)
  ),
  constraint pets_died_at_after_created check (
    died_at is null or died_at >= created_at
  ),
  -- last_fed_at không được trước created_at quá mức bất hợp lý (dung sai 1 phút skew)
  constraint pets_last_fed_sane check (
    last_fed_at >= created_at - interval '1 minute'
  )
);

create index pets_species_id_idx on public.pets (species_id);
create index pets_status_idx on public.pets (status);

-- =========================================================================
-- 4. pet_caregivers (co-op: tối đa 2 active, 1 active owner)
-- =========================================================================
create table public.pet_caregivers (
  pet_id uuid not null references public.pets (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null,
  status text not null default 'active',
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  primary key (pet_id, user_id),
  constraint pet_caregivers_role_valid check (role in ('owner', 'co_parent')),
  constraint pet_caregivers_status_valid check (status in ('active', 'left', 'removed')),
  constraint pet_caregivers_left_at_rule check (
    (status = 'active' and left_at is null)
    or (status in ('left', 'removed') and left_at is not null)
  )
);

create index pet_caregivers_user_id_idx on public.pet_caregivers (user_id);
create index pet_caregivers_pet_active_idx
  on public.pet_caregivers (pet_id)
  where status = 'active';

-- Mỗi pet chỉ có tối đa MỘT active owner.
create unique index pet_caregivers_one_active_owner
  on public.pet_caregivers (pet_id)
  where role = 'owner' and status = 'active';

-- =========================================================================
-- 5. pet_feeding_logs (append-only; feed RPC tạo ở Phase 4 Bước 2)
-- =========================================================================
create table public.pet_feeding_logs (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  actor_user_id uuid not null references auth.users (id) on delete restrict,
  food_key text not null,
  idempotency_key text not null,
  previous_last_fed_at timestamptz not null,
  fed_at timestamptz not null default now(),
  resulting_life_status text not null,
  created_at timestamptz not null default now(),

  constraint pet_feeding_logs_food_key_valid check (
    char_length(btrim(food_key)) between 1 and 100
  ),
  constraint pet_feeding_logs_idempotency_valid check (
    char_length(btrim(idempotency_key)) between 1 and 200
  ),
  constraint pet_feeding_logs_life_status_valid check (
    resulting_life_status in ('normal', 'hungry', 'very_hungry', 'weak', 'critical', 'dead')
  ),
  constraint pet_feeding_logs_unique_idem unique (pet_id, idempotency_key)
);

create index pet_feeding_logs_pet_fed_idx
  on public.pet_feeding_logs (pet_id, fed_at desc);
create index pet_feeding_logs_actor_idx
  on public.pet_feeding_logs (actor_user_id);
create index pet_feeding_logs_created_idx
  on public.pet_feeding_logs (created_at);

-- =========================================================================
-- 6. updated_at triggers (tái sử dụng public.set_updated_at đã có)
-- =========================================================================
create trigger set_pet_species_updated_at
  before update on public.pet_species
  for each row execute function public.set_updated_at();

create trigger set_eggs_updated_at
  before update on public.eggs
  for each row execute function public.set_updated_at();

create trigger set_pets_updated_at
  before update on public.pets
  for each row execute function public.set_updated_at();

create trigger set_pet_caregivers_updated_at
  before update on public.pet_caregivers
  for each row execute function public.set_updated_at();

-- =========================================================================
-- 7. Trigger giới hạn tối đa 2 active caregivers / pet (an toàn concurrency)
--
-- Vì sao BEFORE + row lock: SELECT ... FOR UPDATE trên public.pets khóa dòng
-- pet tương ứng, TUẦN TỰ HÓA mọi thay đổi caregiver theo từng pet. Transaction
-- đồng thời thứ hai phải CHỜ transaction thứ nhất commit rồi mới đếm lại ->
-- ngăn race condition vượt quá 2 active caregiver. Không cần advisory lock.
-- =========================================================================
create or replace function public.enforce_max_two_caregivers()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_active_count integer;
  v_locked boolean;
begin
  -- Chỉ kiểm tra khi row (mới hoặc sau cập nhật) ở trạng thái active.
  if new.status <> 'active' then
    return new;
  end if;

  -- 1. Khóa dòng pet để tuần tự hóa thay đổi caregiver của pet này.
  select true
    into v_locked
  from public.pets
  where id = new.pet_id
  for update;

  -- 2. Pet không tồn tại: raise rõ ràng (FK cũng sẽ chặn, nhưng báo sớm).
  if not found then
    raise exception 'Pet % khong ton tai', new.pet_id
      using errcode = 'foreign_key_violation';
  end if;

  -- 3-4. Đếm active caregiver hiện có, LOẠI TRỪ chính row đang thao tác
  --      (theo cặp pet_id + user_id) để UPDATE không tự đếm mình.
  select count(*)
    into v_active_count
  from public.pet_caregivers
  where pet_id = new.pet_id
    and status = 'active'
    and not (pet_id = new.pet_id and user_id = new.user_id);

  -- 5. Đã có >= 2 active khác -> thêm row active này là quá giới hạn.
  if v_active_count >= 2 then
    raise exception
      'Pet % da co toi da 2 nguoi cham soc dang hoat dong', new.pet_id
      using errcode = 'check_violation';
  end if;

  -- 6.
  return new;
end;
$$;

-- Đổi trigger AFTER cũ -> BEFORE INSERT OR UPDATE.
drop trigger if exists trg_enforce_max_two_caregivers on public.pet_caregivers;
create trigger trg_enforce_max_two_caregivers
  before insert or update on public.pet_caregivers
  for each row execute function public.enforce_max_two_caregivers();

-- =========================================================================
-- 8. Helper: is_active_pet_caregiver (phục vụ RLS policy)
-- =========================================================================
create or replace function public.is_active_pet_caregiver(
  p_pet_id uuid,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select true
      from public.pet_caregivers pc
      where pc.pet_id = p_pet_id
        and pc.user_id = p_user_id
        and pc.status = 'active'
      limit 1
    ),
    false
  );
$$;

revoke execute on function public.is_active_pet_caregiver(uuid, uuid) from public, anon;
grant execute on function public.is_active_pet_caregiver(uuid, uuid) to authenticated, service_role;

-- =========================================================================
-- 9. Row Level Security
-- =========================================================================
alter table public.pet_species enable row level security;
alter table public.eggs enable row level security;
alter table public.pets enable row level security;
alter table public.pet_caregivers enable row level security;
alter table public.pet_feeding_logs enable row level security;

-- pet_species: authenticated xem species đang active
create policy "Authenticated can view active species"
  on public.pet_species
  for select
  to authenticated
  using (is_active = true);

-- eggs: user xem egg của chính mình
create policy "Users can view their own eggs"
  on public.eggs
  for select
  to authenticated
  using (auth.uid() is not null and owner_user_id = auth.uid());

-- pets: user xem pet mà mình đang là active caregiver
create policy "Caregivers can view their pets"
  on public.pets
  for select
  to authenticated
  using (public.is_active_pet_caregiver(id, auth.uid()));

-- pet_caregivers: user xem caregiver của pet mà mình đang là active caregiver
create policy "Caregivers can view co-caregivers"
  on public.pet_caregivers
  for select
  to authenticated
  using (public.is_active_pet_caregiver(pet_id, auth.uid()));

-- pet_feeding_logs: user xem log của pet mà mình đang là active caregiver
create policy "Caregivers can view feeding logs"
  on public.pet_feeding_logs
  for select
  to authenticated
  using (public.is_active_pet_caregiver(pet_id, auth.uid()));

-- =========================================================================
-- 10. Table grants
--   anon: không quyền. authenticated: chỉ SELECT.
--   postgres & service_role: giữ quyền quản trị mặc định.
-- =========================================================================
revoke all on table public.pet_species from anon, authenticated;
revoke all on table public.eggs from anon, authenticated;
revoke all on table public.pets from anon, authenticated;
revoke all on table public.pet_caregivers from anon, authenticated;
revoke all on table public.pet_feeding_logs from anon, authenticated;

grant select on table public.pet_species to authenticated;
grant select on table public.eggs to authenticated;
grant select on table public.pets to authenticated;
grant select on table public.pet_caregivers to authenticated;
grant select on table public.pet_feeding_logs to authenticated;

-- =========================================================================
-- 11. Comments
-- =========================================================================
comment on table public.pet_species is
  'Catalog loài pet (dữ liệu tĩnh). Chưa seed vì artwork/danh sách chưa duyệt.';
comment on table public.eggs is
  'Trứng của người dùng. Thời gian ấp/nở tính hoàn toàn theo server time.';
comment on table public.pets is
  'Pet đã nở. Trạng thái đói tính động từ (server_now - last_fed_at); sau 120 giờ không ăn được xem là dead. Một pet có tối đa 2 active caregiver.';
comment on table public.pet_caregivers is
  'Quan hệ nhiều-nhiều người<->pet cho co-op. Tối đa 2 active caregiver/pet, tối đa 1 active owner.';
comment on table public.pet_feeding_logs is
  'Lịch sử cho ăn (append-only). Client không insert trực tiếp; feed đi qua RPC (Phase 4 Bước 2).';

comment on column public.eggs.hatches_at is
  'Mốc thời gian SERVER mà trứng sẽ nở (chống gian lận đổi giờ thiết bị).';
comment on column public.pets.status is
  'Trạng thái vòng đời ĐÃ MATERIALIZE: active hoặc dead. Life-state hiển thị (normal/hungry/very_hungry/weak/critical/dead) được TÍNH ĐỘNG từ database server time và last_fed_at; cột status (và died_at) chỉ được materialize qua transaction/RPC hoặc scheduled job, KHÔNG tự đổi chỉ vì thời gian trôi qua.';
comment on column public.pets.last_fed_at is
  'Lần cuối pet được cho ăn (DATABASE server time) — nguồn thời gian DUY NHẤT để tính life-state: <24h normal, 24-48h hungry, 48-72h very_hungry, 72-96h weak, 96-120h critical, >=120h dead. Khi vượt 120h pet được COI LÀ dead về mặt nghiệp vụ. Feed RPC (bước sau) phải: khóa row pet, dùng now() của database, nếu đã quá 120h thì đánh dấu dead và KHÔNG cho feed hồi sinh, và tăng state_version khi state thay đổi.';
comment on column public.pets.died_at is
  'Thời điểm pet chết, CHỈ có khi status = dead. Được materialize qua transaction/RPC/scheduled job — không tự sinh chỉ vì đã quá 120h (life-state vẫn tính động cho tới khi được materialize).';
comment on column public.pets.state_version is
  'Bộ đếm optimistic-locking cho cập nhật trạng thái pet (>= 1).';
comment on column public.pet_caregivers.role is
  'Vai trò caregiver: owner hoặc co_parent. Mỗi pet tối đa 1 active owner.';
comment on column public.pet_feeding_logs.idempotency_key is
  'Khóa idempotency chống double-feed; unique theo (pet_id, idempotency_key).';

commit;

-- =========================================================================
-- Rollback thủ công (KHÔNG tự chạy — xóa có kiểm soát khi thật sự cần):
-- =========================================================================
--   drop table if exists public.pet_feeding_logs;
--   drop table if exists public.pet_caregivers;
--   drop table if exists public.pets;
--   drop table if exists public.eggs;
--   drop table if exists public.pet_species;
--   drop function if exists public.enforce_max_two_caregivers();
--   drop function if exists public.is_active_pet_caregiver(uuid, uuid);
-- Lưu ý: KHÔNG drop/delete auth.users; KHÔNG drop public.set_updated_at()
-- (được dùng chung với bảng profiles).
