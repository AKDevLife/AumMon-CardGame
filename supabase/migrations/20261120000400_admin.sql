-- Task 9.1 — developer admin (RBAC + audit). Everything lives in the non-exposed
-- private schema: clients can neither read nor write roles, so a player can never
-- grant themselves admin. Edge Functions check the role (and MFA level) server-side.

create table private.admin_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('super_admin')),
  granted_at timestamptz not null default now(),
  granted_by text not null
);

create table private.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null check (char_length(action) between 1 and 64),
  target_type text,
  target_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index admin_audit_log_time_idx on private.admin_audit_log(created_at desc);

-- Append-only audit trail (no edits or deletes, even by the server code path).
create function private.audit_log_immutable() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'admin_audit_log is append-only';
end $$;
create trigger admin_audit_log_no_update before update or delete on private.admin_audit_log
  for each row execute function private.audit_log_immutable();

revoke all on private.admin_roles, private.admin_audit_log from public, anon, authenticated;
grant select, insert on private.admin_audit_log to service_role;
grant select on private.admin_roles to service_role;

-- Bootstrap (owner/operator only: SQL editor or management API, never the client).
-- Idempotent: re-running for the same email changes nothing and logs nothing new.
create function private.grant_admin(p_email text, p_granted_by text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid;
begin
  select id into v_user from auth.users where lower(email) = lower(p_email);
  if v_user is null then
    raise exception 'No auth user with email %', p_email;
  end if;
  insert into private.admin_roles (user_id, role, granted_by)
  values (v_user, 'super_admin', p_granted_by)
  on conflict (user_id) do nothing;
  if found then
    insert into private.admin_audit_log (action, target_type, target_id, details)
    values ('admin.granted', 'user', v_user::text, jsonb_build_object('by', p_granted_by));
  end if;
  return v_user;
end $$;

create function private.revoke_admin(p_email text, p_revoked_by text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid;
begin
  select id into v_user from auth.users where lower(email) = lower(p_email);
  delete from private.admin_roles where user_id = v_user;
  if found then
    insert into private.admin_audit_log (action, target_type, target_id, details)
    values ('admin.revoked', 'user', v_user::text, jsonb_build_object('by', p_revoked_by));
  end if;
end $$;

revoke execute on function private.grant_admin(text, text), private.revoke_admin(text, text),
  private.audit_log_immutable() from public, anon, authenticated;
