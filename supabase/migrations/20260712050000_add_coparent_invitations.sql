begin;

create table public.pet_caregiver_invitations (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  token_hash text not null unique,
  code_hash text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_by uuid references auth.users (id) on delete set null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint pet_caregiver_invitations_not_both check (
    not (accepted_at is not null and revoked_at is not null)
  ),
  constraint pet_caregiver_invitations_accepted_by_rule check (
    (accepted_at is null and accepted_by is null)
    or (accepted_at is not null and accepted_by is not null)
  )
);

create index pet_caregiver_invitations_pet_idx on public.pet_caregiver_invitations (pet_id);
create unique index pet_caregiver_invitations_one_pending
  on public.pet_caregiver_invitations (pet_id)
  where accepted_at is null and revoked_at is null;

create table public.pet_invitation_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  outcome text not null,
  created_at timestamptz not null default now(),
  constraint pet_invitation_attempts_outcome_valid check (outcome in ('failed', 'success'))
);

create index pet_invitation_attempts_user_idx
  on public.pet_invitation_attempts (user_id, created_at desc);

alter table public.pet_core_requests
  drop constraint pet_core_requests_operation_valid;
alter table public.pet_core_requests
  add constraint pet_core_requests_operation_valid check (
    operation in (
      'create_egg', 'start_incubation', 'hatch_egg', 'feed_pet',
      'set_game_tz', 'start_pet_sleep', 'wake_pet', 'clean_pet_waste',
      'create_invitation', 'revoke_invitation', 'accept_invitation',
      'remove_co_parent', 'leave_pet'
    )
  );

alter table public.pet_caregiver_invitations enable row level security;
alter table public.pet_invitation_attempts enable row level security;
revoke all on table public.pet_caregiver_invitations from public, anon, authenticated;
revoke all on table public.pet_invitation_attempts from public, anon, authenticated;

create or replace function public.pet_invitation_hash(p_value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select encode(extensions.digest(p_value, 'sha256'), 'hex');
$$;

create or replace function public.pet_invitation_normalize_code(p_code text)
returns text
language sql
immutable
set search_path = ''
as $$
  select regexp_replace(upper(btrim(coalesce(p_code, ''))), '[^A-Z0-9]', '', 'g');
$$;

create or replace function public.pet_invitation_generate_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_alphabet text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  v_bytes bytea := extensions.gen_random_bytes(10);
  v_out text := '';
begin
  for i in 0..9 loop
    v_out := v_out || substr(v_alphabet, (get_byte(v_bytes, i) % 32) + 1, 1);
  end loop;
  return v_out;
end;
$$;

create or replace function public.pet_invitation_within_rate_limit(p_user uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((
    select count(*) < 10
    from public.pet_invitation_attempts a
    where a.user_id = p_user
      and a.outcome = 'failed'
      and a.created_at > now() - interval '10 minutes'
  ), true);
$$;

create or replace function public.create_pet_caregiver_invitation(
  p_pet_id uuid,
  p_idempotency_key text
)
returns table (
  invitation_id uuid,
  invite_token text,
  invite_code text,
  expires_at timestamptz,
  pet_name text,
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
  v_pet public.pets;
  v_raw_token text;
  v_raw_code text;
  v_expires timestamptz;
  v_inv uuid;
begin
  if v_user is null then
    raise exception 'authentication required' using errcode = 'insufficient_privilege';
  end if;
  if p_pet_id is null then
    raise exception 'invalid pet id' using errcode = 'check_violation';
  end if;
  if char_length(v_key) < 1 or char_length(v_key) > 200 then
    raise exception 'invalid idempotency key' using errcode = 'check_violation';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user::text || ':create_invitation:' || v_key, 0));

  select r.* into v_req from public.pet_core_requests r
  where r.user_id = v_user and r.operation = 'create_invitation' and r.idempotency_key = v_key;
  if found then
    return query
    select (v_req.result ->> 'invitation_id')::uuid, null::text, null::text,
           (v_req.result ->> 'expires_at')::timestamptz, v_req.result ->> 'pet_name', true;
    return;
  end if;

  v_pet := public.resolve_pet_lifecycle(p_pet_id);
  if v_pet.id is null then
    raise exception 'pet not found' using errcode = 'no_data_found';
  end if;

  if not exists (
    select 1 from public.pet_caregivers c
    where c.pet_id = p_pet_id and c.user_id = v_user and c.status = 'active' and c.role = 'owner'
  ) then
    raise exception 'only owner can invite' using errcode = 'insufficient_privilege';
  end if;
  if v_pet.status = 'dead' then
    raise exception 'pet is not alive' using errcode = 'check_violation';
  end if;
  if exists (
    select 1 from public.pet_caregivers c
    where c.pet_id = p_pet_id and c.status = 'active' and c.role = 'co_parent'
  ) then
    raise exception 'pet already has a co-parent' using errcode = 'check_violation';
  end if;

  update public.pet_caregiver_invitations
  set revoked_at = now()
  where pet_id = p_pet_id and accepted_at is null and revoked_at is null;

  v_raw_token := replace(translate(encode(extensions.gen_random_bytes(32), 'base64'), '+/', '-_'), '=', '');
  v_raw_code := public.pet_invitation_generate_code();
  v_expires := now() + interval '24 hours';

  insert into public.pet_caregiver_invitations (pet_id, created_by, token_hash, code_hash, expires_at)
  values (
    p_pet_id, v_user,
    public.pet_invitation_hash(v_raw_token),
    public.pet_invitation_hash(v_raw_code),
    v_expires
  )
  returning id into v_inv;

  insert into public.pet_core_requests (user_id, operation, idempotency_key, resource_id, result)
  values (
    v_user, 'create_invitation', v_key, p_pet_id,
    jsonb_build_object('invitation_id', v_inv, 'expires_at', v_expires, 'pet_name', v_pet.name)
  );

  return query
  select v_inv, v_raw_token, substr(v_raw_code, 1, 5) || '-' || substr(v_raw_code, 6, 5),
         v_expires, v_pet.name, false;
end;
$$;

create or replace function public.revoke_pet_caregiver_invitation(
  p_pet_id uuid,
  p_idempotency_key text
)
returns table (outcome text, server_now timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_key text := btrim(coalesce(p_idempotency_key, ''));
  v_count integer;
begin
  if v_user is null then
    raise exception 'authentication required' using errcode = 'insufficient_privilege';
  end if;
  if p_pet_id is null then
    raise exception 'invalid pet id' using errcode = 'check_violation';
  end if;
  if char_length(v_key) < 1 or char_length(v_key) > 200 then
    raise exception 'invalid idempotency key' using errcode = 'check_violation';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user::text || ':revoke_invitation:' || v_key, 0));

  if not exists (
    select 1 from public.pet_caregivers c
    where c.pet_id = p_pet_id and c.user_id = v_user and c.status = 'active' and c.role = 'owner'
  ) then
    raise exception 'only owner can revoke' using errcode = 'insufficient_privilege';
  end if;

  update public.pet_caregiver_invitations
  set revoked_at = now()
  where pet_id = p_pet_id and accepted_at is null and revoked_at is null;
  get diagnostics v_count = row_count;

  return query select case when v_count > 0 then 'revoked' else 'nothing_pending' end, now();
end;
$$;

create or replace function public.preview_pet_caregiver_invitation(
  p_invite_token text,
  p_invite_code text
)
returns table (
  status text,
  pet_name text,
  owner_display_name text,
  expires_at timestamptz,
  pet_has_co_parent boolean,
  viewer_is_caregiver boolean,
  viewer_is_owner boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_token text := nullif(btrim(coalesce(p_invite_token, '')), '');
  v_code_norm text := public.pet_invitation_normalize_code(p_invite_code);
  v_is_code boolean := v_code_norm <> '';
  v_hash text;
  v_inv public.pet_caregiver_invitations;
  v_pet public.pets;
  v_status text;
  v_owner text;
  v_has_co boolean;
  v_is_caregiver boolean;
  v_is_owner boolean;
begin
  if v_user is null then
    raise exception 'authentication required' using errcode = 'insufficient_privilege';
  end if;
  if (v_token is not null) = v_is_code then
    raise exception 'exactly one of token or code is required' using errcode = 'check_violation';
  end if;

  if v_is_code and not public.pet_invitation_within_rate_limit(v_user) then
    return query select 'rate_limited', null::text, null::text, null::timestamptz, null::boolean, null::boolean, null::boolean;
    return;
  end if;

  if v_token is not null then
    v_hash := public.pet_invitation_hash(v_token);
    select i.* into v_inv from public.pet_caregiver_invitations i where i.token_hash = v_hash;
  else
    v_hash := public.pet_invitation_hash(v_code_norm);
    select i.* into v_inv from public.pet_caregiver_invitations i where i.code_hash = v_hash;
  end if;

  if not found then
    if v_is_code then
      insert into public.pet_invitation_attempts (user_id, outcome) values (v_user, 'failed');
    end if;
    return query select 'invalid', null::text, null::text, null::timestamptz, null::boolean, null::boolean, null::boolean;
    return;
  end if;

  select p.* into v_pet from public.pets p where p.id = v_inv.pet_id;

  if v_inv.accepted_at is not null then
    v_status := 'used';
  elsif v_inv.revoked_at is not null then
    v_status := 'revoked';
  elsif v_inv.expires_at <= now() then
    v_status := 'expired';
  elsif v_pet.status = 'dead' or now() - v_pet.last_fed_at >= interval '120 hours' then
    v_status := 'pet_unavailable';
  else
    v_status := 'valid';
  end if;

  if v_is_code and v_status <> 'valid' then
    insert into public.pet_invitation_attempts (user_id, outcome) values (v_user, 'failed');
  end if;

  select pr.display_name into v_owner from public.profiles pr where pr.id = v_inv.created_by;
  v_has_co := exists (
    select 1 from public.pet_caregivers c
    where c.pet_id = v_inv.pet_id and c.status = 'active' and c.role = 'co_parent'
  );
  v_is_caregiver := public.is_active_pet_caregiver(v_inv.pet_id, v_user);
  v_is_owner := (v_inv.created_by = v_user);

  return query select v_status, v_pet.name, v_owner, v_inv.expires_at, v_has_co, v_is_caregiver, v_is_owner;
end;
$$;

create or replace function public.accept_pet_caregiver_invitation(
  p_invite_token text,
  p_invite_code text,
  p_idempotency_key text
)
returns table (outcome text, pet_id uuid, server_now timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_key text := btrim(coalesce(p_idempotency_key, ''));
  v_token text := nullif(btrim(coalesce(p_invite_token, '')), '');
  v_code_norm text := public.pet_invitation_normalize_code(p_invite_code);
  v_is_code boolean := v_code_norm <> '';
  v_req public.pet_core_requests;
  v_hash text;
  v_inv public.pet_caregiver_invitations;
  v_pet public.pets;
  v_now timestamptz;
  v_outcome text;
begin
  if v_user is null then
    raise exception 'authentication required' using errcode = 'insufficient_privilege';
  end if;
  if char_length(v_key) < 1 or char_length(v_key) > 200 then
    raise exception 'invalid idempotency key' using errcode = 'check_violation';
  end if;
  if (v_token is not null) = v_is_code then
    raise exception 'exactly one of token or code is required' using errcode = 'check_violation';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user::text || ':accept_invitation:' || v_key, 0));

  select r.* into v_req from public.pet_core_requests r
  where r.user_id = v_user and r.operation = 'accept_invitation' and r.idempotency_key = v_key;
  if found then
    return query select v_req.result ->> 'outcome', (v_req.result ->> 'pet_id')::uuid, now();
    return;
  end if;

  if v_is_code and not public.pet_invitation_within_rate_limit(v_user) then
    return query select 'rate_limited', null::uuid, now();
    return;
  end if;

  if v_token is not null then
    v_hash := public.pet_invitation_hash(v_token);
    select i.* into v_inv from public.pet_caregiver_invitations i where i.token_hash = v_hash for update;
  else
    v_hash := public.pet_invitation_hash(v_code_norm);
    select i.* into v_inv from public.pet_caregiver_invitations i where i.code_hash = v_hash for update;
  end if;

  if not found then
    if v_is_code then
      insert into public.pet_invitation_attempts (user_id, outcome) values (v_user, 'failed');
    end if;
    return query select 'invalid', null::uuid, now();
    return;
  end if;

  v_pet := public.resolve_pet_lifecycle(v_inv.pet_id);
  v_now := now();

  if v_inv.accepted_at is not null then
    v_outcome := 'used';
  elsif v_inv.revoked_at is not null then
    v_outcome := 'revoked';
  elsif v_inv.expires_at <= v_now then
    v_outcome := 'expired';
  elsif v_pet.status = 'dead' then
    v_outcome := 'pet_unavailable';
  elsif v_inv.created_by = v_user then
    v_outcome := 'self_owner';
  elsif public.is_active_pet_caregiver(v_inv.pet_id, v_user) then
    v_outcome := 'already_caregiver';
  elsif exists (
    select 1 from public.pet_caregivers c
    where c.pet_id = v_inv.pet_id and c.status = 'active' and c.role = 'co_parent'
  ) then
    v_outcome := 'pet_full';
  else
    if exists (select 1 from public.pet_caregivers c where c.pet_id = v_inv.pet_id and c.user_id = v_user) then
      update public.pet_caregivers c
      set role = 'co_parent', status = 'active', left_at = null, joined_at = v_now, updated_at = v_now
      where c.pet_id = v_inv.pet_id and c.user_id = v_user;
    else
      insert into public.pet_caregivers (pet_id, user_id, role, status)
      values (v_inv.pet_id, v_user, 'co_parent', 'active');
    end if;

    update public.pet_caregiver_invitations i
    set accepted_at = v_now, accepted_by = v_user
    where i.id = v_inv.id;

    v_outcome := 'accepted';
  end if;

  if v_is_code and v_outcome not in ('accepted') then
    insert into public.pet_invitation_attempts (user_id, outcome) values (v_user, 'failed');
  end if;

  insert into public.pet_core_requests (user_id, operation, idempotency_key, resource_id, result)
  values (
    v_user, 'accept_invitation', v_key, v_inv.pet_id,
    jsonb_build_object('outcome', v_outcome, 'pet_id', case when v_outcome = 'accepted' then v_inv.pet_id else null end)
  );

  return query select v_outcome, case when v_outcome = 'accepted' then v_inv.pet_id else null end, v_now;
end;
$$;

create or replace function public.remove_pet_co_parent(
  p_pet_id uuid,
  p_idempotency_key text
)
returns table (outcome text, server_now timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_key text := btrim(coalesce(p_idempotency_key, ''));
  v_count integer;
begin
  if v_user is null then
    raise exception 'authentication required' using errcode = 'insufficient_privilege';
  end if;
  if p_pet_id is null then
    raise exception 'invalid pet id' using errcode = 'check_violation';
  end if;
  if char_length(v_key) < 1 or char_length(v_key) > 200 then
    raise exception 'invalid idempotency key' using errcode = 'check_violation';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user::text || ':remove_co_parent:' || v_key, 0));

  if not exists (
    select 1 from public.pet_caregivers c
    where c.pet_id = p_pet_id and c.user_id = v_user and c.status = 'active' and c.role = 'owner'
  ) then
    raise exception 'only owner can remove co-parent' using errcode = 'insufficient_privilege';
  end if;

  update public.pet_caregivers c
  set status = 'removed', left_at = now(), updated_at = now()
  where c.pet_id = p_pet_id and c.status = 'active' and c.role = 'co_parent';
  get diagnostics v_count = row_count;

  return query select case when v_count > 0 then 'removed' else 'no_co_parent' end, now();
end;
$$;

create or replace function public.leave_pet_as_co_parent(
  p_pet_id uuid,
  p_idempotency_key text
)
returns table (outcome text, server_now timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_key text := btrim(coalesce(p_idempotency_key, ''));
  v_count integer;
begin
  if v_user is null then
    raise exception 'authentication required' using errcode = 'insufficient_privilege';
  end if;
  if p_pet_id is null then
    raise exception 'invalid pet id' using errcode = 'check_violation';
  end if;
  if char_length(v_key) < 1 or char_length(v_key) > 200 then
    raise exception 'invalid idempotency key' using errcode = 'check_violation';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user::text || ':leave_pet:' || v_key, 0));

  update public.pet_caregivers c
  set status = 'left', left_at = now(), updated_at = now()
  where c.pet_id = p_pet_id and c.user_id = v_user and c.status = 'active' and c.role = 'co_parent';
  get diagnostics v_count = row_count;

  return query select case when v_count > 0 then 'left' else 'not_co_parent' end, now();
end;
$$;

create or replace function public.get_pet_coparent_state(p_pet_id uuid)
returns table (
  viewer_role text,
  owner_display_name text,
  co_parent_display_name text,
  co_parent_avatar_url text,
  has_co_parent boolean,
  pending_expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_role text;
begin
  if v_user is null then
    raise exception 'authentication required' using errcode = 'insufficient_privilege';
  end if;
  if not public.is_active_pet_caregiver(p_pet_id, v_user) then
    raise exception 'not a caregiver of this pet' using errcode = 'insufficient_privilege';
  end if;

  select c.role into v_role from public.pet_caregivers c
  where c.pet_id = p_pet_id and c.user_id = v_user and c.status = 'active';

  return query
  select
    v_role,
    (select pr.display_name from public.profiles pr
       join public.pet_caregivers oc on oc.user_id = pr.id
       where oc.pet_id = p_pet_id and oc.status = 'active' and oc.role = 'owner' limit 1),
    (select pr.display_name from public.profiles pr
       join public.pet_caregivers cc on cc.user_id = pr.id
       where cc.pet_id = p_pet_id and cc.status = 'active' and cc.role = 'co_parent' limit 1),
    (select pr.avatar_url from public.profiles pr
       join public.pet_caregivers cc on cc.user_id = pr.id
       where cc.pet_id = p_pet_id and cc.status = 'active' and cc.role = 'co_parent' limit 1),
    exists (select 1 from public.pet_caregivers cc
       where cc.pet_id = p_pet_id and cc.status = 'active' and cc.role = 'co_parent'),
    case when v_role = 'owner' then (
      select i.expires_at from public.pet_caregiver_invitations i
      where i.pet_id = p_pet_id and i.accepted_at is null and i.revoked_at is null and i.expires_at > now()
      order by i.created_at desc limit 1
    ) else null end;
end;
$$;

revoke execute on function public.pet_invitation_hash(text) from public, anon, authenticated;
revoke execute on function public.pet_invitation_normalize_code(text) from public, anon, authenticated;
revoke execute on function public.pet_invitation_generate_code() from public, anon, authenticated;
revoke execute on function public.pet_invitation_within_rate_limit(uuid) from public, anon, authenticated;
revoke execute on function public.create_pet_caregiver_invitation(uuid, text) from public, anon;
revoke execute on function public.revoke_pet_caregiver_invitation(uuid, text) from public, anon;
revoke execute on function public.preview_pet_caregiver_invitation(text, text) from public, anon;
revoke execute on function public.accept_pet_caregiver_invitation(text, text, text) from public, anon;
revoke execute on function public.remove_pet_co_parent(uuid, text) from public, anon;
revoke execute on function public.leave_pet_as_co_parent(uuid, text) from public, anon;
revoke execute on function public.get_pet_coparent_state(uuid) from public, anon;

grant execute on function public.create_pet_caregiver_invitation(uuid, text) to authenticated;
grant execute on function public.revoke_pet_caregiver_invitation(uuid, text) to authenticated;
grant execute on function public.preview_pet_caregiver_invitation(text, text) to authenticated;
grant execute on function public.accept_pet_caregiver_invitation(text, text, text) to authenticated;
grant execute on function public.remove_pet_co_parent(uuid, text) to authenticated;
grant execute on function public.leave_pet_as_co_parent(uuid, text) to authenticated;
grant execute on function public.get_pet_coparent_state(uuid) to authenticated;

commit;
