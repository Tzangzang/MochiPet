begin;

create or replace function public.pet_variant_fnv_index(p_value text)
returns integer
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_hash bigint := 2166136261;
  v_byte integer;
begin
  for v_i in 1..length(p_value) loop
    v_byte := ascii(substring(p_value from v_i for 1));
    v_hash := ((v_hash # v_byte::bigint) * 16777619) % 4294967296;
  end loop;
  return (v_hash % 30)::integer;
end;
$$;

create table public.pet_variants (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  display_name text not null,
  image_path text not null unique,
  rarity text not null,
  rarity_label text not null,
  weight integer not null,
  is_enabled boolean not null default true,
  sort_order integer not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pet_variants_code_not_blank check (char_length(btrim(code)) between 1 and 100),
  constraint pet_variants_display_name_not_blank check (char_length(btrim(display_name)) between 1 and 100),
  constraint pet_variants_image_path_prefix check (image_path like '/pets/catalog/%'),
  constraint pet_variants_rarity_valid check (rarity in ('common', 'uncommon', 'rare', 'ultra_rare')),
  constraint pet_variants_rarity_label_not_blank check (char_length(btrim(rarity_label)) between 1 and 100),
  constraint pet_variants_weight_positive check (weight > 0),
  constraint pet_variants_sort_order_range check (sort_order between 1 and 30)
);

create trigger set_pet_variants_updated_at
  before update on public.pet_variants
  for each row execute function public.set_updated_at();

insert into public.pet_variants (code, display_name, image_path, rarity, rarity_label, weight, sort_order)
values
  ('01_cat', 'Mèo', '/pets/catalog/01_cat.webp', 'common', 'Rất dễ nở', 100, 1),
  ('02_dog', 'Chó', '/pets/catalog/02_dog.webp', 'common', 'Rất dễ nở', 100, 2),
  ('03_rabbit', 'Thỏ', '/pets/catalog/03_rabbit.webp', 'common', 'Rất dễ nở', 100, 3),
  ('04_hamster', 'Chuột hamster', '/pets/catalog/04_hamster.webp', 'common', 'Rất dễ nở', 100, 4),
  ('05_guinea_pig', 'Chuột lang', '/pets/catalog/05_guinea_pig.webp', 'common', 'Rất dễ nở', 100, 5),
  ('06_ferret', 'Chồn sương', '/pets/catalog/06_ferret.webp', 'common', 'Rất dễ nở', 100, 6),
  ('07_red_panda', 'Gấu trúc đỏ', '/pets/catalog/07_red_panda.webp', 'common', 'Rất dễ nở', 100, 7),
  ('08_fox', 'Cáo', '/pets/catalog/08_fox.webp', 'common', 'Rất dễ nở', 100, 8),
  ('09_raccoon', 'Gấu mèo', '/pets/catalog/09_raccoon.webp', 'common', 'Rất dễ nở', 100, 9),
  ('10_hedgehog', 'Nhím', '/pets/catalog/10_hedgehog.webp', 'common', 'Rất dễ nở', 100, 10),
  ('11_squirrel', 'Sóc', '/pets/catalog/11_squirrel.webp', 'common', 'Rất dễ nở', 100, 11),
  ('12_capybara', 'Chuột lang nước', '/pets/catalog/12_capybara.webp', 'common', 'Rất dễ nở', 100, 12),
  ('13_panda', 'Gấu trúc', '/pets/catalog/13_panda.webp', 'uncommon', 'Bình thường', 60, 13),
  ('14_koala', 'Gấu koala', '/pets/catalog/14_koala.webp', 'uncommon', 'Bình thường', 60, 14),
  ('15_sloth', 'Lười', '/pets/catalog/15_sloth.webp', 'uncommon', 'Bình thường', 60, 15),
  ('16_alpaca', 'Lạc đà không bướu', '/pets/catalog/16_alpaca.webp', 'uncommon', 'Bình thường', 60, 16),
  ('17_otter', 'Rái cá', '/pets/catalog/17_otter.webp', 'uncommon', 'Bình thường', 60, 17),
  ('18_penguin', 'Chim cánh cụt', '/pets/catalog/18_penguin.webp', 'uncommon', 'Bình thường', 60, 18),
  ('19_axolotl', 'Kỳ giông', '/pets/catalog/19_axolotl.webp', 'rare', 'Hiếm', 20, 19),
  ('20_seal', 'Hải cẩu', '/pets/catalog/20_seal.webp', 'rare', 'Hiếm', 20, 20),
  ('21_sea_turtle', 'Rùa biển', '/pets/catalog/21_sea_turtle.webp', 'rare', 'Hiếm', 20, 21),
  ('22_pufferfish', 'Cá nóc', '/pets/catalog/22_pufferfish.webp', 'rare', 'Hiếm', 20, 22),
  ('23_octopus', 'Bạch tuộc', '/pets/catalog/23_octopus.webp', 'rare', 'Hiếm', 20, 23),
  ('24_dolphin', 'Cá heo', '/pets/catalog/24_dolphin.webp', 'rare', 'Hiếm', 20, 24),
  ('25_baby_dragon', 'Rồng con', '/pets/catalog/25_baby_dragon.webp', 'ultra_rare', 'Siêu hiếm', 5, 25),
  ('26_unicorn', 'Kỳ lân', '/pets/catalog/26_unicorn.webp', 'ultra_rare', 'Siêu hiếm', 5, 26),
  ('27_phoenix', 'Phượng hoàng', '/pets/catalog/27_phoenix.webp', 'ultra_rare', 'Siêu hiếm', 5, 27),
  ('28_cloud_spirit', 'Tinh linh mây', '/pets/catalog/28_cloud_spirit.webp', 'ultra_rare', 'Siêu hiếm', 5, 28),
  ('29_moon_spirit', 'Tinh linh trăng', '/pets/catalog/29_moon_spirit.webp', 'ultra_rare', 'Siêu hiếm', 5, 29),
  ('30_sprout_spirit', 'Tinh linh mầm cây', '/pets/catalog/30_sprout_spirit.webp', 'ultra_rare', 'Siêu hiếm', 5, 30)
on conflict (code) do nothing;

alter table public.pets add column variant_id uuid references public.pet_variants (id) on delete restrict;
create index pets_variant_id_idx on public.pets (variant_id);

update public.pets p
set variant_id = (
  select v.id from public.pet_variants v
  where v.sort_order = public.pet_variant_fnv_index(p.id::text) + 1
)
where p.variant_id is null;

drop function if exists public.hatch_egg(uuid, text, text);

create function public.hatch_egg(
  p_egg_id uuid,
  p_pet_name text,
  p_idempotency_key text
)
returns table (
  egg_id uuid,
  pet_id uuid,
  pet_name text,
  species_code text,
  pet_status text,
  hatched_at timestamptz,
  variant_code text,
  variant_image_path text,
  replayed boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_key text := btrim(coalesce(p_idempotency_key, ''));
  v_name text := btrim(coalesce(p_pet_name, ''));
  v_req public.pet_core_requests;
  v_egg public.eggs;
  v_now timestamptz;
  v_pet uuid;
  v_code text;
  v_dup uuid;
  v_total bigint;
  v_threshold numeric;
  v_variant uuid;
  v_variant_code text;
  v_variant_path text;
begin
  if v_user is null then
    raise exception 'authentication required' using errcode = 'insufficient_privilege';
  end if;
  if p_egg_id is null then
    raise exception 'invalid egg id' using errcode = 'check_violation';
  end if;
  if char_length(v_key) < 1 or char_length(v_key) > 200 then
    raise exception 'invalid idempotency key' using errcode = 'check_violation';
  end if;
  if char_length(v_name) < 1 or char_length(v_name) > 40 then
    raise exception 'invalid pet name' using errcode = 'check_violation';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user::text || ':hatch_egg:' || v_key, 0));

  select r.* into v_req
  from public.pet_core_requests r
  where r.user_id = v_user and r.operation = 'hatch_egg' and r.idempotency_key = v_key;
  if found then
    if (v_req.result ->> 'egg_id')::uuid <> p_egg_id
       or coalesce(v_req.result ->> 'pet_name', '') <> v_name then
      raise exception 'idempotency key already used with different input' using errcode = 'check_violation';
    end if;
    return query
    select (v_req.result ->> 'egg_id')::uuid, (v_req.result ->> 'pet_id')::uuid,
           v_req.result ->> 'pet_name', v_req.result ->> 'species_code', v_req.result ->> 'pet_status',
           (v_req.result ->> 'hatched_at')::timestamptz,
           v_req.result ->> 'variant_code', v_req.result ->> 'variant_image_path', true;
    return;
  end if;

  select e.* into v_egg
  from public.eggs e
  where e.id = p_egg_id and e.owner_user_id = v_user
  for update;
  if not found then
    raise exception 'egg not found' using errcode = 'no_data_found';
  end if;

  select r.* into v_req
  from public.pet_core_requests r
  where r.user_id = v_user and r.operation = 'hatch_egg' and r.idempotency_key = v_key;
  if found then
    if (v_req.result ->> 'egg_id')::uuid <> p_egg_id
       or coalesce(v_req.result ->> 'pet_name', '') <> v_name then
      raise exception 'idempotency key already used with different input' using errcode = 'check_violation';
    end if;
    return query
    select (v_req.result ->> 'egg_id')::uuid, (v_req.result ->> 'pet_id')::uuid,
           v_req.result ->> 'pet_name', v_req.result ->> 'species_code', v_req.result ->> 'pet_status',
           (v_req.result ->> 'hatched_at')::timestamptz,
           v_req.result ->> 'variant_code', v_req.result ->> 'variant_image_path', true;
    return;
  end if;

  if v_egg.species_id is null then
    raise exception 'egg has no species' using errcode = 'check_violation';
  end if;
  if v_egg.status <> 'incubating' then
    raise exception 'egg is not incubating' using errcode = 'check_violation';
  end if;

  v_now := now();
  if v_egg.hatches_at is null or v_now < v_egg.hatches_at then
    raise exception 'egg is not ready to hatch' using errcode = 'check_violation';
  end if;

  select p.id into v_dup from public.pets p where p.egg_id = p_egg_id;
  if found then
    raise exception 'egg already hatched' using errcode = 'unique_violation';
  end if;

  select s.code into v_code from public.pet_species s where s.id = v_egg.species_id;

  select coalesce(sum(weight), 0) into v_total
  from public.pet_variants where is_enabled = true and weight > 0;
  if v_total <= 0 then
    raise exception 'no enabled pet variant available' using errcode = 'no_data_found';
  end if;

  v_threshold := random() * v_total;
  select w.id, w.code, w.image_path into v_variant, v_variant_code, v_variant_path
  from (
    select id, code, image_path,
      sum(weight) over (order by sort_order rows between unbounded preceding and current row) as cum
    from public.pet_variants where is_enabled = true and weight > 0
  ) w
  where w.cum > v_threshold
  order by w.cum
  limit 1;

  insert into public.pets (egg_id, species_id, variant_id, name, status, last_fed_at, died_at, state_version)
  values (p_egg_id, v_egg.species_id, v_variant, v_name, 'active', v_now, null, 1)
  returning id into v_pet;

  insert into public.pet_caregivers (pet_id, user_id, role, status)
  values (v_pet, v_user, 'owner', 'active');

  update public.eggs e
  set status = 'hatched', hatched_at = v_now, updated_at = v_now
  where e.id = p_egg_id;

  insert into public.pet_core_requests (user_id, operation, idempotency_key, resource_id, result)
  values (
    v_user, 'hatch_egg', v_key, v_pet,
    jsonb_build_object(
      'egg_id', p_egg_id, 'pet_id', v_pet, 'pet_name', v_name, 'species_code', v_code,
      'pet_status', 'active', 'hatched_at', v_now,
      'variant_code', v_variant_code, 'variant_image_path', v_variant_path
    )
  );

  return query
  select p_egg_id, v_pet, v_name, v_code, 'active'::text, v_now, v_variant_code, v_variant_path, false;
end;
$$;

drop function if exists public.get_pet_room_state(uuid, text);

create function public.get_pet_room_state(
  p_pet_id uuid,
  p_client_tz text
)
returns table (
  pet_id uuid,
  status text,
  hunger_state text,
  last_fed_at timestamptz,
  died_at timestamptz,
  state_version bigint,
  server_now timestamptz,
  can_feed boolean,
  next_feed_at timestamptz,
  next_state_at timestamptz,
  game_tz text,
  pending_game_tz text,
  current_game_date date,
  meal_count_today smallint,
  meals_required smallint,
  health smallint,
  hygiene smallint,
  is_refusing_food boolean,
  refusing_food_days smallint,
  sleep_debt_days smallint,
  is_sleeping boolean,
  current_sleep_started_at timestamptz,
  sleep_seconds_today integer,
  required_sleep_seconds integer,
  waste jsonb,
  variant_id uuid,
  variant_code text,
  variant_display_name text,
  variant_image_path text,
  variant_rarity text,
  variant_rarity_label text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_tz text := btrim(coalesce(p_client_tz, ''));
  v_pet public.pets;
  v_now timestamptz;
  v_is_owner boolean;
  v_sleeping boolean;
  v_started timestamptz;
  v_sleep_today integer;
  v_day_start timestamptz;
  v_variant public.pet_variants;
begin
  if v_user is null then
    raise exception 'authentication required' using errcode = 'insufficient_privilege';
  end if;
  if p_pet_id is null then
    raise exception 'invalid pet id' using errcode = 'check_violation';
  end if;

  select p.* into v_pet from public.pets p where p.id = p_pet_id for update;
  if not found then
    raise exception 'pet not found' using errcode = 'no_data_found';
  end if;
  if not public.is_active_pet_caregiver(p_pet_id, v_user) then
    raise exception 'not a caregiver of this pet' using errcode = 'insufficient_privilege';
  end if;

  select exists (
    select 1 from public.pet_caregivers c
    where c.pet_id = p_pet_id and c.user_id = v_user and c.status = 'active' and c.role = 'owner'
  ) into v_is_owner;

  if v_is_owner and v_pet.status = 'active' and v_pet.game_tz is null and public.pet_tz_is_valid(v_tz) then
    update public.pets p
    set game_tz = v_tz, current_game_date = (now() at time zone v_tz)::date, updated_at = now()
    where p.id = p_pet_id;
  elsif v_is_owner and v_pet.status = 'active' and v_pet.game_tz is not null
        and public.pet_tz_is_valid(v_tz) and v_pet.game_tz <> v_tz then
    update public.pets p set pending_game_tz = v_tz, updated_at = now() where p.id = p_pet_id;
  end if;

  v_pet := public.resolve_pet_lifecycle(p_pet_id);
  v_now := now();

  if v_pet.variant_id is not null then
    select v.* into v_variant from public.pet_variants v where v.id = v_pet.variant_id;
  end if;

  select s.started_at into v_started
  from public.pet_sleep_sessions s
  where s.pet_id = p_pet_id and s.ended_at is null
  limit 1;
  v_sleeping := v_started is not null;

  if v_pet.game_tz is not null and v_pet.current_game_date is not null then
    v_day_start := (v_pet.current_game_date::timestamp) at time zone v_pet.game_tz;
    v_sleep_today := public.pet_sleep_seconds(p_pet_id, v_day_start, v_now, v_pet.lifecycle_started_at);
  else
    v_sleep_today := 0;
  end if;

  return query
  select
    v_pet.id, v_pet.status, d.hunger_state, v_pet.last_fed_at, v_pet.died_at, v_pet.state_version,
    v_now, d.can_feed, d.next_feed_at, d.next_state_at,
    v_pet.game_tz, v_pet.pending_game_tz, v_pet.current_game_date,
    v_pet.meal_count_today, 3::smallint, v_pet.health, v_pet.hygiene,
    v_pet.is_refusing_food, v_pet.refusing_food_days, v_pet.sleep_debt_days,
    v_sleeping, v_started, v_sleep_today, 28800,
    coalesce((
      select jsonb_agg(jsonb_build_object('id', x.id, 'available_at', x.available_at, 'pos_seed', x.pos_seed)
                       order by x.available_at)
      from (
        select w.id, w.available_at, w.pos_seed
        from public.pet_waste w
        where w.pet_id = p_pet_id and w.cleaned_at is null and w.available_at <= v_now
        order by w.available_at
        limit 5
      ) x
    ), '[]'::jsonb),
    v_pet.variant_id, v_variant.code, v_variant.display_name, v_variant.image_path,
    v_variant.rarity, v_variant.rarity_label
  from public.pet_derived_state(v_pet.last_fed_at, v_pet.status, v_pet.died_at, v_now) d;
end;
$$;

alter table public.pet_variants enable row level security;
revoke all on table public.pet_variants from public, anon, authenticated;
revoke execute on function public.pet_variant_fnv_index(text) from public, anon, authenticated;

revoke execute on function public.hatch_egg(uuid, text, text) from public, anon;
revoke execute on function public.get_pet_room_state(uuid, text) from public, anon;
grant execute on function public.hatch_egg(uuid, text, text) to authenticated;
grant execute on function public.get_pet_room_state(uuid, text) to authenticated;

commit;
