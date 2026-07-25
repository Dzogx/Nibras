-- Nibras foundation. All organization data must carry organization_id and RLS.
create extension if not exists pgcrypto;
create extension if not exists vector;

create type public.app_role as enum ('teacher', 'subject_coordinator', 'inspector', 'school_manager', 'knowledge_editor', 'platform_admin');
create type public.membership_status as enum ('active', 'invited', 'suspended');
create type public.audit_action as enum ('create', 'read', 'update', 'delete', 'share', 'export', 'publish', 'login');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 200),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 2 and 160),
  locale text not null default 'ar-DZ',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'teacher',
  status public.membership_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);
create index memberships_user_active_idx on public.memberships(user_id, organization_id) where status = 'active';

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  action public.audit_action not null,
  resource_type text not null check (char_length(resource_type) <= 100),
  resource_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_events_org_created_idx on public.audit_events(organization_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger organizations_updated_at before update on public.organizations for each row execute function public.set_updated_at();
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger memberships_updated_at before update on public.memberships for each row execute function public.set_updated_at();

create or replace function public.is_active_member(target_organization_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.memberships m
    where m.organization_id = target_organization_id and m.user_id = auth.uid() and m.status = 'active'
  );
$$;

create or replace function public.has_organization_role(target_organization_id uuid, allowed_roles public.app_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.memberships m
    where m.organization_id = target_organization_id and m.user_id = auth.uid()
      and m.status = 'active' and m.role = any(allowed_roles)
  );
$$;

revoke all on function public.is_active_member(uuid) from public;
revoke all on function public.has_organization_role(uuid, public.app_role[]) from public;
grant execute on function public.is_active_member(uuid) to authenticated;
grant execute on function public.has_organization_role(uuid, public.app_role[]) to authenticated;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.audit_events enable row level security;

create policy "organization members can read their organization" on public.organizations for select to authenticated using (public.is_active_member(id));
create policy "admins can update their organization" on public.organizations for update to authenticated using (public.has_organization_role(id, array['school_manager','platform_admin']::public.app_role[])) with check (public.has_organization_role(id, array['school_manager','platform_admin']::public.app_role[]));

create policy "users can read own profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "users can update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "members can read organization memberships" on public.memberships for select to authenticated using (public.is_active_member(organization_id));
create policy "managers can manage memberships" on public.memberships for all to authenticated using (public.has_organization_role(organization_id, array['school_manager','platform_admin']::public.app_role[])) with check (public.has_organization_role(organization_id, array['school_manager','platform_admin']::public.app_role[]));

create policy "authorized members can read audit events" on public.audit_events for select to authenticated using (public.has_organization_role(organization_id, array['school_manager','platform_admin']::public.app_role[]));

-- Storage bucket and policies: only server-mediated upload is permitted in Sprint 0.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('private-documents', 'private-documents', false, 52428800, array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do nothing;

create policy "deny direct storage reads by default" on storage.objects for select to authenticated using (false);
create policy "deny direct storage writes by default" on storage.objects for insert to authenticated with check (false);
