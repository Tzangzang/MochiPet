begin;

alter table public.pets
  add column game_tz text,
  add column pending_game_tz text,
  add column health smallint not null default 100,
  add column hygiene smallint not null default 100,
  add column meal_count_today smallint not null default 0,
  add column current_game_date date,
  add column sleep_debt_days smallint not null default 0,
  add column refusing_food_days smallint not null default 0,
  add column is_refusing_food boolean not null default false,
  add column stats_resolved_at timestamptz not null default now(),
  add column lifecycle_started_at timestamptz not null default now();

alter table public.pets
  add constraint pets_health_bounds check (health between 0 and 100),
  add constraint pets_hygiene_bounds check (hygiene between 0 and 100),
  add constraint pets_meal_count_bounds check (meal_count_today between 0 and 3),
  add constraint pets_sleep_debt_bounds check (sleep_debt_days >= 0),
  add constraint pets_refusing_days_bounds check (refusing_food_days >= 0),
  add constraint pets_game_tz_not_blank check (game_tz is null or char_length(btrim(game_tz)) between 1 and 100),
  add constraint pets_pending_game_tz_not_blank check (pending_game_tz is null or char_length(btrim(pending_game_tz)) between 1 and 100);

create table public.pet_daily_states (
  pet_id uuid not null references public.pets (id) on delete cascade,
  game_date date not null,
  game_tz text not null,
  meal_count smallint not null default 0,
  missed_meals smallint not null default 0,
  sleep_seconds integer not null default 0,
  sleep_requirement_met boolean not null default false,
  is_grace_day boolean not null default false,
  finalized_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (pet_id, game_date),
  constraint pet_daily_states_meal_count_bounds check (meal_count between 0 and 3),
  constraint pet_daily_states_missed_meals_bounds check (missed_meals between 0 and 3),
  constraint pet_daily_states_sleep_seconds_bounds check (sleep_seconds >= 0),
  constraint pet_daily_states_game_tz_not_blank check (char_length(btrim(game_tz)) between 1 and 100)
);

create index pet_daily_states_pet_idx on public.pet_daily_states (pet_id, game_date desc);

create table public.pet_sleep_sessions (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  started_by uuid not null references auth.users (id) on delete restrict,
  ended_by uuid references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint pet_sleep_sessions_end_after_start check (ended_at is null or ended_at >= started_at)
);

create index pet_sleep_sessions_pet_idx on public.pet_sleep_sessions (pet_id, started_at desc);
create unique index pet_sleep_sessions_one_open on public.pet_sleep_sessions (pet_id) where ended_at is null;

create table public.pet_waste (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  source_feeding_log_id uuid not null unique references public.pet_feeding_logs (id) on delete cascade,
  available_at timestamptz not null,
  cleaned_at timestamptz,
  cleaned_by uuid references auth.users (id) on delete restrict,
  pos_seed smallint not null,
  created_at timestamptz not null default now(),
  constraint pet_waste_clean_after_available check (cleaned_at is null or cleaned_at >= available_at),
  constraint pet_waste_pos_seed_bounds check (pos_seed between 0 and 32767)
);

create index pet_waste_pet_idx on public.pet_waste (pet_id, available_at);
create index pet_waste_active_idx on public.pet_waste (pet_id) where cleaned_at is null;

alter table public.pet_core_requests
  drop constraint pet_core_requests_operation_valid;
alter table public.pet_core_requests
  add constraint pet_core_requests_operation_valid check (
    operation in (
      'create_egg', 'start_incubation', 'hatch_egg', 'feed_pet',
      'set_game_tz', 'start_pet_sleep', 'wake_pet', 'clean_pet_waste'
    )
  );

alter table public.pet_daily_states enable row level security;
alter table public.pet_sleep_sessions enable row level security;
alter table public.pet_waste enable row level security;

create policy "Caregivers can view daily states"
  on public.pet_daily_states
  for select
  to authenticated
  using (public.is_active_pet_caregiver(pet_id, auth.uid()));

create policy "Caregivers can view sleep sessions"
  on public.pet_sleep_sessions
  for select
  to authenticated
  using (public.is_active_pet_caregiver(pet_id, auth.uid()));

create policy "Caregivers can view waste"
  on public.pet_waste
  for select
  to authenticated
  using (public.is_active_pet_caregiver(pet_id, auth.uid()));

revoke all on table public.pet_daily_states from public, anon, authenticated;
revoke all on table public.pet_sleep_sessions from public, anon, authenticated;
revoke all on table public.pet_waste from public, anon, authenticated;

grant select on table public.pet_daily_states to authenticated;
grant select on table public.pet_sleep_sessions to authenticated;
grant select on table public.pet_waste to authenticated;

commit;
