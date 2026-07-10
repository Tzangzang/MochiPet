begin;

insert into public.pet_species (code, display_name, asset_key, description, is_active)
values (
  'starter_mochi',
  'Starter Mochi',
  'placeholders/pets/starter-mochi',
  'Placeholder species for MVP development; artwork is not final.',
  true
)
on conflict (code) do nothing;

create unique index eggs_one_active_per_owner
  on public.eggs (owner_user_id)
  where status in ('unhatched', 'incubating');

create table public.pet_core_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  operation text not null,
  idempotency_key text not null,
  resource_id uuid,
  result jsonb,
  created_at timestamptz not null default now(),
  constraint pet_core_requests_operation_valid check (
    operation in ('create_egg', 'start_incubation', 'hatch_egg')
  ),
  constraint pet_core_requests_key_valid check (
    char_length(btrim(idempotency_key)) between 1 and 200
  ),
  constraint pet_core_requests_unique unique (user_id, operation, idempotency_key)
);

create index pet_core_requests_user_id_idx on public.pet_core_requests (user_id);
create index pet_core_requests_operation_idx on public.pet_core_requests (operation);
create index pet_core_requests_created_at_idx on public.pet_core_requests (created_at);

alter table public.pet_core_requests enable row level security;
revoke all on table public.pet_core_requests from public, anon, authenticated;

create or replace function public.create_egg(
  p_species_code text,
  p_idempotency_key text
)
returns table (
  egg_id uuid,
  species_code text,
  status text,
  created_at timestamptz,
  replayed boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_key text := btrim(coalesce(p_idempotency_key, ''));
  v_code text := btrim(coalesce(p_species_code, ''));
  v_species uuid;
  v_req public.pet_core_requests;
  v_egg public.eggs;
  v_active integer;
begin
  if v_user is null then
    raise exception 'authentication required' using errcode = 'insufficient_privilege';
  end if;
  if char_length(v_key) < 1 or char_length(v_key) > 200 then
    raise exception 'invalid idempotency key' using errcode = 'check_violation';
  end if;
  if char_length(v_code) < 1 then
    raise exception 'invalid species code' using errcode = 'check_violation';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user::text || ':create_egg', 0));
  perform pg_advisory_xact_lock(hashtextextended(v_user::text || ':create_egg:' || v_key, 0));

  select r.* into v_req
  from public.pet_core_requests r
  where r.user_id = v_user and r.operation = 'create_egg' and r.idempotency_key = v_key;
  if found then
    if coalesce(v_req.result ->> 'species_code', '') <> v_code then
      raise exception 'idempotency key already used with a different species' using errcode = 'check_violation';
    end if;
    return query
    select (v_req.result ->> 'egg_id')::uuid,
           v_req.result ->> 'species_code',
           v_req.result ->> 'status',
           (v_req.result ->> 'created_at')::timestamptz,
           true;
    return;
  end if;

  select s.id into v_species
  from public.pet_species s
  where s.code = v_code and s.is_active = true;
  if not found then
    raise exception 'species not found' using errcode = 'no_data_found';
  end if;

  select count(*) into v_active
  from public.eggs e
  where e.owner_user_id = v_user and e.status in ('unhatched', 'incubating');
  if v_active > 0 then
    raise exception 'user already has an active egg' using errcode = 'check_violation';
  end if;

  insert into public.eggs (owner_user_id, species_id, status)
  values (v_user, v_species, 'unhatched')
  returning * into v_egg;

  insert into public.pet_core_requests (user_id, operation, idempotency_key, resource_id, result)
  values (
    v_user, 'create_egg', v_key, v_egg.id,
    jsonb_build_object(
      'egg_id', v_egg.id,
      'species_code', v_code,
      'status', v_egg.status,
      'created_at', v_egg.created_at
    )
  );

  return query
  select v_egg.id, v_code, v_egg.status, v_egg.created_at, false;
end;
$$;

create or replace function public.start_egg_incubation(
  p_egg_id uuid,
  p_idempotency_key text
)
returns table (
  egg_id uuid,
  status text,
  hatch_started_at timestamptz,
  hatches_at timestamptz,
  replayed boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_key text := btrim(coalesce(p_idempotency_key, ''));
  v_req public.pet_core_requests;
  v_egg public.eggs;
  v_now timestamptz;
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

  perform pg_advisory_xact_lock(hashtextextended(v_user::text || ':start_incubation:' || v_key, 0));

  select r.* into v_req
  from public.pet_core_requests r
  where r.user_id = v_user and r.operation = 'start_incubation' and r.idempotency_key = v_key;
  if found then
    if (v_req.result ->> 'egg_id')::uuid <> p_egg_id then
      raise exception 'idempotency key already used for a different egg' using errcode = 'check_violation';
    end if;
    return query
    select (v_req.result ->> 'egg_id')::uuid,
           v_req.result ->> 'status',
           (v_req.result ->> 'hatch_started_at')::timestamptz,
           (v_req.result ->> 'hatches_at')::timestamptz,
           true;
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
  where r.user_id = v_user and r.operation = 'start_incubation' and r.idempotency_key = v_key;
  if found then
    if (v_req.result ->> 'egg_id')::uuid <> p_egg_id then
      raise exception 'idempotency key already used for a different egg' using errcode = 'check_violation';
    end if;
    return query
    select (v_req.result ->> 'egg_id')::uuid,
           v_req.result ->> 'status',
           (v_req.result ->> 'hatch_started_at')::timestamptz,
           (v_req.result ->> 'hatches_at')::timestamptz,
           true;
    return;
  end if;

  if v_egg.species_id is null then
    raise exception 'egg has no species' using errcode = 'check_violation';
  end if;
  if v_egg.status <> 'unhatched' then
    raise exception 'egg cannot be incubated' using errcode = 'check_violation';
  end if;

  v_now := now();

  update public.eggs e
  set status = 'incubating',
      hatch_started_at = v_now,
      hatches_at = v_now + interval '5 minutes',
      updated_at = v_now
  where e.id = p_egg_id
  returning e.* into v_egg;

  insert into public.pet_core_requests (user_id, operation, idempotency_key, resource_id, result)
  values (
    v_user, 'start_incubation', v_key, v_egg.id,
    jsonb_build_object(
      'egg_id', v_egg.id,
      'status', v_egg.status,
      'hatch_started_at', v_egg.hatch_started_at,
      'hatches_at', v_egg.hatches_at
    )
  );

  return query
  select v_egg.id, v_egg.status, v_egg.hatch_started_at, v_egg.hatches_at, false;
end;
$$;

create or replace function public.hatch_egg(
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
    select (v_req.result ->> 'egg_id')::uuid,
           (v_req.result ->> 'pet_id')::uuid,
           v_req.result ->> 'pet_name',
           v_req.result ->> 'species_code',
           v_req.result ->> 'pet_status',
           (v_req.result ->> 'hatched_at')::timestamptz,
           true;
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
    select (v_req.result ->> 'egg_id')::uuid,
           (v_req.result ->> 'pet_id')::uuid,
           v_req.result ->> 'pet_name',
           v_req.result ->> 'species_code',
           v_req.result ->> 'pet_status',
           (v_req.result ->> 'hatched_at')::timestamptz,
           true;
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

  insert into public.pets (egg_id, species_id, name, status, last_fed_at, died_at, state_version)
  values (p_egg_id, v_egg.species_id, v_name, 'active', v_now, null, 1)
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
      'egg_id', p_egg_id,
      'pet_id', v_pet,
      'pet_name', v_name,
      'species_code', v_code,
      'pet_status', 'active',
      'hatched_at', v_now
    )
  );

  return query
  select p_egg_id, v_pet, v_name, v_code, 'active'::text, v_now, false;
end;
$$;

revoke execute on function public.create_egg(text, text) from public, anon;
revoke execute on function public.start_egg_incubation(uuid, text) from public, anon;
revoke execute on function public.hatch_egg(uuid, text, text) from public, anon;

grant execute on function public.create_egg(text, text) to authenticated;
grant execute on function public.start_egg_incubation(uuid, text) to authenticated;
grant execute on function public.hatch_egg(uuid, text, text) to authenticated;

commit;
