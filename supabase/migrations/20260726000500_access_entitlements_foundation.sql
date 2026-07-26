-- Commercial strategy foundation: generic access grants, without billing or checkout.
create type public.access_grant_status as enum ('active', 'suspended', 'expired', 'revoked');
create type public.access_grant_source as enum ('trial', 'subscription', 'manual', 'internal');

create table public.academic_years (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^\d{4}-\d{4}$'),
  starts_on date not null,
  ends_on date not null,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  check (ends_on > starts_on)
);
create unique index academic_years_single_current_idx on public.academic_years(is_current) where is_current;

create table public.access_grants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source_type public.access_grant_source not null,
  source_reference text,
  status public.access_grant_status not null default 'active',
  capability text not null check (capability ~ '^[a-z][a-z0-9_.-]{2,100}$'),
  subject_id uuid references public.subjects(id) on delete restrict,
  grade_level_id uuid references public.grade_levels(id) on delete restrict,
  academic_year_id uuid references public.academic_years(id) on delete restrict,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  usage_limit integer check (usage_limit is null or usage_limit >= 0),
  constraints jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);
create index access_grants_scope_idx on public.access_grants(organization_id, capability, status, starts_at, ends_at);
create index access_grants_constraints_idx on public.access_grants using gin(constraints);
create trigger access_grants_updated_at before update on public.access_grants for each row execute function public.set_updated_at();

create table public.access_usage_events (
  id uuid primary key default gen_random_uuid(),
  access_grant_id uuid not null references public.access_grants(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  capability text not null,
  quantity integer not null default 1 check (quantity > 0),
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  unique (access_grant_id, idempotency_key)
);
create index access_usage_events_grant_idx on public.access_usage_events(access_grant_id, created_at desc);

alter table public.academic_years enable row level security;
alter table public.access_grants enable row level security;
alter table public.access_usage_events enable row level security;

create policy "authenticated users read academic years" on public.academic_years for select to authenticated using (true);
create policy "workspace users read their grants" on public.access_grants for select to authenticated using (public.is_active_member(organization_id));
create policy "workspace users read their usage" on public.access_usage_events for select to authenticated using (public.is_active_member(organization_id));
-- Grants and usage are written only by server-side commercial workflows in a later phase.
