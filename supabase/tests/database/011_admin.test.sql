-- Task 9.1 — admin roles are server-only; bootstrap is idempotent and audited.
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000ad01', 'owner@test.local'),
  ('00000000-0000-0000-0000-00000000ad02', 'player@test.local');

select is(private.grant_admin('OWNER@test.local', 'test'), '00000000-0000-0000-0000-00000000ad01'::uuid, 'grant by email (case-insensitive)');
select lives_ok($$select private.grant_admin('owner@test.local', 'test')$$, 'grant is idempotent');
select is((select count(*)::int from private.admin_roles), 1, 'one admin row');
select is((select count(*)::int from private.admin_audit_log where action = 'admin.granted'), 1, 'grant audited once');
select throws_ok($$select private.grant_admin('nobody@test.local', 'test')$$, 'P0001', null, 'unknown email rejected');
select throws_ok($$update private.admin_audit_log set action = 'x'$$, 'P0001', null, 'audit log cannot be edited');
select throws_ok($$delete from private.admin_audit_log$$, 'P0001', null, 'audit log cannot be deleted');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000ad02","role":"authenticated"}', true);
select throws_ok($$insert into private.admin_roles (user_id, role, granted_by) values ('00000000-0000-0000-0000-00000000ad02', 'super_admin', 'me')$$,
  '42501', null, 'player cannot grant themselves admin');
select throws_ok($$select private.grant_admin('player@test.local', 'me')$$, '42501', null, 'player cannot call grant_admin');
select throws_ok($$select * from private.admin_audit_log$$, '42501', null, 'player cannot read audit log');
reset role;

select * from finish();
rollback;
