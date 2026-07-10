begin;

insert into public.pet_species (code, display_name, asset_key, is_active)
values ('starter_mochi', 'Starter Mochi', 'placeholder/starter_mochi', true)
on conflict (code) do nothing;

create table public.pet_core_idempotency (
  user_id uuid not null references auth.users (id) on delete cascade,
  action text not null,
  idempotency_key text not null,
  egg_id uuid references public.eggs (id) on delete set null,
  pet_id uuid references public.pets (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (user_id, action, idempotency_key),
  constraint pet_core_idempotency_action_valid check (
    action in ('create_egg', 'start_incubation', 'hatch_egg')
  ),
  constraint pet_core_idempotency_key_valid check (
    char_length(btrim(idempotency_key)) between 1 and 200
  )
);

alter table public.pet_core_idempotency enable row level security;
revoke all on table public.pet_core_idempotency from anon, authenticated;

create or replace function public.create_egg(
  p_idempotency_key text,
  p_species_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_key text := btrim(coalesce(p_idempotency_key, ''));
  v_existing uuid;
  v_species uuid;
  v_egg uuid;
begin
  if v_user is null then
    raise exception 'authentication required' using errcode = 'insufficient_privilege';
  end if;

  if char_length(v_key) < 1 or char_length(v_key) > 200 then
    raise exception 'invalid idempotency key' using errcode = 'check_violation';
  end if;

  insert into public.pet_core_idempotency (user_id, action, idempotency_key)
  values (v_user, 'create_egg', v_key)
  on conflict (user_id, action, idempotency_key)
    do update set idempotency_key = public.pet_core_idempotency.idempotency_key
  returning egg_id into v_existing;

  if v_existing is not null then
    return v_existing;
  end if;

  v_species := p_species_id;
  if v_species is null then
    select id into v_species
    from public.pet_species
    where code = 'starter_mochi' and is_active
    limit 1;
  else
    perform 1 from public.pet_species where id = v_species and is_active;
    if not found then
      raise exception 'invalid species' using errcode = 'foreign_key_violation';
    end if;
  end if;

  insert into public.eggs (owner_user_id, species_id, status)
  values (v_user, v_species, 'unhatched')
  returning id into v_egg;

  update public.pet_core_idempotency
  set egg_id = v_egg
  where user_id = v_user and action = 'create_egg' and idempotency_key = v_key;

  return v_egg;
end;
$$;

create or replace function public.start_incubation(
  p_egg_id uuid,
  p_idempotency_key text
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_key text := btrim(coalesce(p_idempotency_key, ''));
  v_existing uuid;
  v_status text;
  v_species uuid;
  v_hatches timestamptz;
begin
  if v_user is null then
    raise exception 'authentication required' using errcode = 'insufficient_privilege';
  end if;

  if char_length(v_key) < 1 or char_length(v_key) > 200 then
    raise exception 'invalid idempotency key' using errcode = 'check_violation';
  end if;

  insert into public.pet_core_idempotency (user_id, action, idempotency_key)
  values (v_user, 'start_incubation', v_key)
  on conflict (user_id, action, idempotency_key)
    do update set idempotency_key = public.pet_core_idempotency.idempotency_key
  returning egg_id into v_existing;

  if v_existing is not null then
    select hatches_at into v_hatches from public.eggs where id = v_existing;
    return v_hatches;
  end if;

  select status, species_id into v_status, v_species
  from public.eggs
  where id = p_egg_id and owner_user_id = v_user
  for update;

  if not found then
    raise exception 'egg not found' using errcode = 'no_data_found';
  end if;

  if v_status = 'incubating' then
    select hatches_at into v_hatches from public.eggs where id = p_egg_id;
    update public.pet_core_idempotency set egg_id = p_egg_id
    where user_id = v_user and action = 'start_incubation' and idempotency_key = v_key;
    return v_hatches;
  end if;

  if v_status <> 'unhatched' then
    raise exception 'egg cannot be incubated' using errcode = 'check_violation';
  end if;

  if v_species is null then
    raise exception 'egg has no species' using errcode = 'check_violation';
  end if;

  update public.eggs
  set status = 'incubating',
      hatch_started_at = now(),
      hatches_at = now() + interval '4 hours'
  where id = p_egg_id
  returning hatches_at into v_hatches;

  update public.pet_core_idempotency set egg_id = p_egg_id
  where user_id = v_user and action = 'start_incubation' and idempotency_key = v_key;

  return v_hatches;
end;
$$;

create or replace function public.hatch_egg(
  p_egg_id uuid,
  p_pet_name text,
  p_idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_key text := btrim(coalesce(p_idempotency_key, ''));
  v_name text := btrim(coalesce(p_pet_name, ''));
  v_existing uuid;
  v_status text;
  v_species uuid;
  v_hatches timestamptz;
  v_pet uuid;
begin
  if v_user is null then
    raise exception 'authentication required' using errcode = 'insufficient_privilege';
  end if;

  if char_length(v_key) < 1 or char_length(v_key) > 200 then
    raise exception 'invalid idempotency key' using errcode = 'check_violation';
  end if;

  if char_length(v_name) < 1 or char_length(v_name) > 40 then
    raise exception 'invalid pet name' using errcode = 'check_violation';
  end if;

  insert into public.pet_core_idempotency (user_id, action, idempotency_key)
  values (v_user, 'hatch_egg', v_key)
  on conflict (user_id, action, idempotency_key)
    do update set idempotency_key = public.pet_core_idempotency.idempotency_key
  returning pet_id into v_existing;

  if v_existing is not null then
    return v_existing;
  end if;

  select status, species_id, hatches_at into v_status, v_species, v_hatches
  from public.eggs
  where id = p_egg_id and owner_user_id = v_user
  for update;

  if not found then
    raise exception 'egg not found' using errcode = 'no_data_found';
  end if;

  if v_status = 'hatched' then
    select id into v_pet from public.pets where egg_id = p_egg_id;
    update public.pet_core_idempotency set pet_id = v_pet
    where user_id = v_user and action = 'hatch_egg' and idempotency_key = v_key;
    return v_pet;
  end if;

  if v_status <> 'incubating' then
    raise exception 'egg is not incubating' using errcode = 'check_violation';
  end if;

  if v_hatches is null or v_hatches > now() then
    raise exception 'egg is not ready to hatch' using errcode = 'check_violation';
  end if;

  insert into public.pets (egg_id, species_id, name, status, last_fed_at, state_version)
  values (p_egg_id, v_species, v_name, 'active', now(), 1)
  returning id into v_pet;

  insert into public.pet_caregivers (pet_id, user_id, role, status)
  values (v_pet, v_user, 'owner', 'active');

  update public.eggs
  set status = 'hatched', hatched_at = now()
  where id = p_egg_id;

  update public.pet_core_idempotency set pet_id = v_pet
  where user_id = v_user and action = 'hatch_egg' and idempotency_key = v_key;

  return v_pet;
end;
$$;

revoke execute on function public.create_egg(text, uuid) from public, anon;
revoke execute on function public.start_incubation(uuid, text) from public, anon;
revoke execute on function public.hatch_egg(uuid, text, text) from public, anon;

grant execute on function public.create_egg(text, uuid) to authenticated;
grant execute on function public.start_incubation(uuid, text) to authenticated;
grant execute on function public.hatch_egg(uuid, text, text) to authenticated;

commit;
