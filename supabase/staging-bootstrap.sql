-- Nibras staging bootstrap: generated from ordered migrations.

-- BEGIN 20260725000100_foundation.sql
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

-- END 20260725000100_foundation.sql

-- BEGIN 20260726000200_identity_bootstrap.sql
-- Sprint 1: secure user bootstrap and organization creation.
-- The function creates only the caller's first organization and membership.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 'مستخدم جديد')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.create_organization_with_owner(organization_name text, organization_slug text)
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  created_organization public.organizations;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if char_length(trim(organization_name)) < 2 or char_length(trim(organization_name)) > 200 then
    raise exception 'Invalid organization name';
  end if;
  if organization_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'Invalid organization slug';
  end if;

  insert into public.organizations (name, slug)
  values (trim(organization_name), organization_slug)
  returning * into created_organization;

  insert into public.memberships (organization_id, user_id, role, status)
  values (created_organization.id, auth.uid(), 'school_manager', 'active');

  insert into public.audit_events (organization_id, actor_id, action, resource_type, resource_id)
  values (created_organization.id, auth.uid(), 'create', 'organization', created_organization.id);

  return created_organization;
end;
$$;

revoke all on function public.create_organization_with_owner(text, text) from public;
grant execute on function public.create_organization_with_owner(text, text) to authenticated;

-- END 20260726000200_identity_bootstrap.sql

-- BEGIN 20260726000300_personal_workspace_mvp.sql
-- ADR-005: MVP exposes a single private teacher workspace, not institution management.

create or replace function public.ensure_personal_workspace()
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_workspace public.organizations;
  profile_name text;
  generated_slug text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select o.* into existing_workspace
  from public.organizations o
  join public.memberships m on m.organization_id = o.id
  where m.user_id = auth.uid() and m.status = 'active'
  order by m.created_at asc
  limit 1;

  if found then
    return existing_workspace;
  end if;

  select display_name into profile_name from public.profiles where id = auth.uid();
  generated_slug := 'teacher-' || replace(auth.uid()::text, '-', '');

  insert into public.organizations (name, slug)
  values (coalesce(nullif(trim(profile_name), ''), 'مساحة عملي') || ' — مساحة العمل', generated_slug)
  returning * into existing_workspace;

  insert into public.memberships (organization_id, user_id, role, status)
  values (existing_workspace.id, auth.uid(), 'teacher', 'active');

  insert into public.audit_events (organization_id, actor_id, action, resource_type, resource_id, metadata)
  values (existing_workspace.id, auth.uid(), 'create', 'workspace', existing_workspace.id, '{"source":"automatic-personal-workspace"}'::jsonb);

  return existing_workspace;
end;
$$;

revoke all on function public.ensure_personal_workspace() from public;
grant execute on function public.ensure_personal_workspace() to authenticated;

-- END 20260726000300_personal_workspace_mvp.sql

-- BEGIN 20260726000400_knowledge_registry.sql
-- Sprint 2: versioned, source-traceable knowledge registry.
create type public.document_status as enum ('draft', 'processing', 'needs_review', 'published', 'archived', 'rejected');
create type public.document_type as enum ('annual_plan', 'curriculum', 'teacher_guide', 'supporting_document', 'textbook', 'institutional_plan');

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9-]+$'),
  name_ar text not null unique,
  created_at timestamptz not null default now()
);
create table public.grade_levels (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code in ('1am','2am','3am','4am')),
  name_ar text not null unique,
  sort_order smallint not null unique check (sort_order between 1 and 4),
  created_at timestamptz not null default now()
);
create table public.curriculum_versions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  issuing_authority text not null,
  effective_from date,
  effective_to date,
  status public.document_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (effective_to is null or effective_from is null or effective_to >= effective_from)
);

create table public.official_documents (
  id uuid primary key default gen_random_uuid(),
  document_type public.document_type not null,
  title text not null check (char_length(trim(title)) between 3 and 500),
  issuing_authority text,
  source_url text,
  license_note text,
  status public.document_status not null default 'draft',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.official_documents(id) on delete cascade,
  curriculum_version_id uuid references public.curriculum_versions(id) on delete set null,
  version_label text not null,
  storage_path text not null unique,
  checksum_sha256 text not null check (checksum_sha256 ~ '^[a-f0-9]{64}$'),
  effective_from date,
  effective_to date,
  supersedes_version_id uuid references public.document_versions(id) on delete set null,
  status public.document_status not null default 'draft',
  uploaded_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  check (effective_to is null or effective_from is null or effective_to >= effective_from),
  unique (document_id, version_label)
);
create table public.document_pages (
  id uuid primary key default gen_random_uuid(),
  document_version_id uuid not null references public.document_versions(id) on delete cascade,
  page_number integer not null check (page_number > 0),
  raw_text text,
  normalized_text text,
  ocr_confidence numeric(5,2) check (ocr_confidence between 0 and 100),
  review_status public.document_status not null default 'processing',
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (document_version_id, page_number)
);
create table public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_version_id uuid not null references public.document_versions(id) on delete cascade,
  parent_page_id uuid references public.document_pages(id) on delete set null,
  chunk_index integer not null check (chunk_index >= 0),
  content text not null check (char_length(trim(content)) > 0),
  search_vector tsvector generated always as (to_tsvector('simple', content)) stored,
  metadata jsonb not null default '{}'::jsonb,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  unique (document_version_id, chunk_index)
);
create table public.document_subjects (
  document_version_id uuid not null references public.document_versions(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete restrict,
  grade_level_id uuid references public.grade_levels(id) on delete restrict,
  primary key (document_version_id, subject_id, grade_level_id)
);
create table public.curriculum_segments (
  id uuid primary key default gen_random_uuid(),
  curriculum_version_id uuid references public.curriculum_versions(id) on delete set null,
  subject_id uuid not null references public.subjects(id) on delete restrict,
  grade_level_id uuid not null references public.grade_levels(id) on delete restrict,
  term_number smallint check (term_number between 1 and 3),
  sort_order integer not null default 0 check (sort_order >= 0),
  title text not null check (char_length(trim(title)) between 3 and 300),
  comprehensive_competence text,
  terminal_competence text,
  source_document_version_id uuid references public.document_versions(id) on delete set null,
  source_page_number integer check (source_page_number is null or source_page_number > 0),
  status public.document_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index curriculum_segments_lookup_idx on public.curriculum_segments(subject_id, grade_level_id, term_number, sort_order);
create trigger curriculum_segments_updated_at before update on public.curriculum_segments for each row execute function public.set_updated_at();

create table public.knowledge_review_tasks (
  id uuid primary key default gen_random_uuid(),
  document_page_id uuid not null references public.document_pages(id) on delete cascade,
  reason text not null,
  status public.document_status not null default 'needs_review',
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index document_versions_document_status_idx on public.document_versions(document_id, status, effective_from desc);
create index document_pages_version_idx on public.document_pages(document_version_id, page_number);
create index document_chunks_fts_idx on public.document_chunks using gin(search_vector);
create index document_chunks_metadata_idx on public.document_chunks using gin(metadata);
create index document_chunks_embedding_idx on public.document_chunks using hnsw (embedding vector_cosine_ops) where embedding is not null;

create trigger curriculum_versions_updated_at before update on public.curriculum_versions for each row execute function public.set_updated_at();
create trigger official_documents_updated_at before update on public.official_documents for each row execute function public.set_updated_at();

alter table public.subjects enable row level security;
alter table public.grade_levels enable row level security;
alter table public.curriculum_versions enable row level security;
alter table public.official_documents enable row level security;
alter table public.document_versions enable row level security;
alter table public.document_pages enable row level security;
alter table public.document_chunks enable row level security;
alter table public.document_subjects enable row level security;
alter table public.curriculum_segments enable row level security;
alter table public.knowledge_review_tasks enable row level security;

-- Authenticated users may read only published knowledge. Service role performs ingestion/review.
create policy "authenticated users read subjects" on public.subjects for select to authenticated using (true);
create policy "authenticated users read grade levels" on public.grade_levels for select to authenticated using (true);
create policy "authenticated users read published curriculum versions" on public.curriculum_versions for select to authenticated using (status = 'published');
create policy "authenticated users read published documents" on public.official_documents for select to authenticated using (status = 'published');
create policy "authenticated users read published document versions" on public.document_versions for select to authenticated using (status = 'published');
create policy "authenticated users read pages of published versions" on public.document_pages for select to authenticated using (exists (select 1 from public.document_versions v where v.id = document_version_id and v.status = 'published'));
create policy "authenticated users read chunks of published versions" on public.document_chunks for select to authenticated using (exists (select 1 from public.document_versions v where v.id = document_version_id and v.status = 'published'));
create policy "authenticated users read published document subject mappings" on public.document_subjects for select to authenticated using (exists (select 1 from public.document_versions v where v.id = document_version_id and v.status = 'published'));
create policy "authenticated users read published curriculum segments" on public.curriculum_segments for select to authenticated using (status = 'published');

-- END 20260726000400_knowledge_registry.sql

-- BEGIN 20260726000500_access_entitlements_foundation.sql
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

-- END 20260726000500_access_entitlements_foundation.sql

-- BEGIN 20260726000600_teacher_os_planning.sql
-- Teacher OS: private teacher planning and confirmed execution events.
create type public.plan_item_status as enum ('planned', 'in_progress', 'completed', 'needs_intervention', 'deferred');
create type public.memory_event_type as enum ('lesson_executed', 'activity_used', 'assessment_completed', 'learning_strength', 'learning_need', 'intervention_completed', 'resource_used', 'project_update');

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  subject_id uuid not null references public.subjects(id) on delete restrict,
  grade_level_id uuid not null references public.grade_levels(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 1 and 100),
  learner_count smallint check (learner_count between 1 and 80),
  constraints jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, academic_year_id, subject_id, grade_level_id, name)
);
create trigger classes_updated_at before update on public.classes for each row execute function public.set_updated_at();

create table public.annual_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  title text not null check (char_length(trim(title)) between 3 and 200),
  source_document_version_id uuid references public.document_versions(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_id, academic_year_id)
);
create trigger annual_plans_updated_at before update on public.annual_plans for each row execute function public.set_updated_at();

create table public.plan_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  annual_plan_id uuid not null references public.annual_plans(id) on delete cascade,
  curriculum_segment_id uuid references public.curriculum_segments(id) on delete set null,
  sort_order integer not null check (sort_order >= 0),
  title text not null check (char_length(trim(title)) between 3 and 300),
  scheduled_on date,
  planned_minutes integer check (planned_minutes between 5 and 600),
  status public.plan_item_status not null default 'planned',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (annual_plan_id, sort_order)
);
create trigger plan_items_updated_at before update on public.plan_items for each row execute function public.set_updated_at();
create index plan_items_next_idx on public.plan_items(annual_plan_id, status, sort_order);

create table public.lesson_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  plan_item_id uuid not null references public.plan_items(id) on delete cascade,
  executed_on date not null,
  actual_minutes integer check (actual_minutes between 1 and 600),
  confirmation_note text,
  confirmed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (plan_item_id, executed_on)
);

create table public.memory_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  plan_item_id uuid references public.plan_items(id) on delete set null,
  event_type public.memory_event_type not null,
  summary text not null check (char_length(trim(summary)) between 3 and 2000),
  metadata jsonb not null default '{}'::jsonb,
  source_type text not null check (source_type in ('teacher_confirmed', 'system_generated')),
  confirmed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((source_type = 'teacher_confirmed' and confirmed_at is not null) or source_type = 'system_generated')
);
create trigger memory_events_updated_at before update on public.memory_events for each row execute function public.set_updated_at();
create index memory_events_scope_idx on public.memory_events(organization_id, class_id, created_at desc);

alter table public.classes enable row level security;
alter table public.annual_plans enable row level security;
alter table public.plan_items enable row level security;
alter table public.lesson_runs enable row level security;
alter table public.memory_events enable row level security;

create policy "workspace users read classes" on public.classes for select to authenticated using (public.is_active_member(organization_id));
create policy "workspace users manage classes" on public.classes for all to authenticated using (public.is_active_member(organization_id)) with check (public.is_active_member(organization_id));
create policy "workspace users read plans" on public.annual_plans for select to authenticated using (public.is_active_member(organization_id));
create policy "workspace users manage plans" on public.annual_plans for all to authenticated using (public.is_active_member(organization_id)) with check (public.is_active_member(organization_id));
create policy "workspace users read plan items" on public.plan_items for select to authenticated using (public.is_active_member(organization_id));
create policy "workspace users manage plan items" on public.plan_items for all to authenticated using (public.is_active_member(organization_id)) with check (public.is_active_member(organization_id));
create policy "workspace users read lesson runs" on public.lesson_runs for select to authenticated using (public.is_active_member(organization_id));
create policy "workspace users manage lesson runs" on public.lesson_runs for all to authenticated using (public.is_active_member(organization_id)) with check (public.is_active_member(organization_id));
create policy "workspace users read confirmed memory" on public.memory_events for select to authenticated using (public.is_active_member(organization_id) and (source_type = 'teacher_confirmed' or confirmed_at is not null));
create policy "workspace users create memory proposals" on public.memory_events for insert to authenticated with check (public.is_active_member(organization_id) and created_by = auth.uid());
create policy "workspace users update memory" on public.memory_events for update to authenticated using (public.is_active_member(organization_id)) with check (public.is_active_member(organization_id));

-- END 20260726000600_teacher_os_planning.sql

-- BEGIN 20260726000700_content_studio_core.sql
-- Content Studio core: editable, versioned resources connected to Teacher OS and evidence.
create type public.content_item_type as enum ('lesson_plan', 'activity', 'worksheet', 'assessment', 'rubric', 'integration_situation', 'presentation_storyboard', 'concept_map', 'mind_map');
create type public.content_status as enum ('draft', 'reviewed', 'approved', 'archived');

create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  plan_item_id uuid references public.plan_items(id) on delete set null,
  subject_id uuid references public.subjects(id) on delete restrict,
  grade_level_id uuid references public.grade_levels(id) on delete restrict,
  academic_year_id uuid references public.academic_years(id) on delete restrict,
  content_type public.content_item_type not null,
  status public.content_status not null default 'draft',
  title text not null check (char_length(trim(title)) between 3 and 300),
  body jsonb not null,
  source_mode text not null check (source_mode in ('teacher_authored', 'ai_assisted', 'template_generated')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger content_items_updated_at before update on public.content_items for each row execute function public.set_updated_at();
create index content_items_workspace_idx on public.content_items(organization_id, content_type, status, created_at desc);
create index content_items_plan_idx on public.content_items(plan_item_id) where plan_item_id is not null;

create table public.content_versions (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  title text not null,
  body jsonb not null,
  change_summary text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (content_item_id, version_number)
);

create table public.content_citations (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references public.content_items(id) on delete cascade,
  document_version_id uuid not null references public.document_versions(id) on delete restrict,
  document_page_id uuid references public.document_pages(id) on delete restrict,
  page_number integer not null check (page_number > 0),
  excerpt text not null check (char_length(trim(excerpt)) between 3 and 3000),
  claim_label text not null check (char_length(trim(claim_label)) between 3 and 300),
  created_at timestamptz not null default now()
);
create index content_citations_item_idx on public.content_citations(content_item_id);

alter table public.content_items enable row level security;
alter table public.content_versions enable row level security;
alter table public.content_citations enable row level security;

create policy "workspace users read content" on public.content_items for select to authenticated using (public.is_active_member(organization_id));
create policy "workspace users create content" on public.content_items for insert to authenticated with check (public.is_active_member(organization_id) and created_by = auth.uid());
create policy "workspace users update content" on public.content_items for update to authenticated using (public.is_active_member(organization_id)) with check (public.is_active_member(organization_id));
create policy "workspace users read content versions" on public.content_versions for select to authenticated using (exists (select 1 from public.content_items c where c.id = content_item_id and public.is_active_member(c.organization_id)));
create policy "workspace users create content versions" on public.content_versions for insert to authenticated with check (exists (select 1 from public.content_items c where c.id = content_item_id and public.is_active_member(c.organization_id)));
create policy "workspace users read content citations" on public.content_citations for select to authenticated using (exists (select 1 from public.content_items c where c.id = content_item_id and public.is_active_member(c.organization_id)));
create policy "workspace users create content citations" on public.content_citations for insert to authenticated with check (exists (select 1 from public.content_items c where c.id = content_item_id and public.is_active_member(c.organization_id)));

-- END 20260726000700_content_studio_core.sql

-- BEGIN 20260726000800_plan_item_reference_metadata.sql
-- Retains source provenance while a plan item is created from a reviewed reference pack.
alter table public.plan_items add column reference_metadata jsonb not null default '{}'::jsonb;
create index plan_items_reference_metadata_idx on public.plan_items using gin(reference_metadata);

-- END 20260726000800_plan_item_reference_metadata.sql

-- BEGIN 20260727000900_summative_assessment_foundation.sql
-- Assessment Bank foundation. UI terminology: التقويم التحصيلي.
create type public.assessment_status as enum ('draft', 'reviewed', 'approved', 'archived');
create type public.cognitive_level as enum ('knowledge', 'comprehension', 'application', 'analysis', 'creation', 'evaluation');

create table public.summative_assessments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  plan_item_id uuid references public.plan_items(id) on delete set null,
  subject_id uuid references public.subjects(id) on delete restrict,
  grade_level_id uuid references public.grade_levels(id) on delete restrict,
  academic_year_id uuid references public.academic_years(id) on delete restrict,
  title text not null check (char_length(trim(title)) between 3 and 300),
  duration_minutes integer not null check (duration_minutes between 10 and 240),
  total_points numeric(5,2) not null check (total_points > 0 and total_points <= 100),
  status public.assessment_status not null default 'draft',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger summative_assessments_updated_at before update on public.summative_assessments for each row execute function public.set_updated_at();

create table public.summative_assessment_items (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.summative_assessments(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete restrict,
  cognitive_level public.cognitive_level not null,
  instruction text not null check (char_length(trim(instruction)) between 3 and 5000),
  expected_answer jsonb not null default '{}'::jsonb,
  points numeric(5,2) not null check (points > 0 and points <= 100),
  sort_order integer not null check (sort_order >= 0),
  created_at timestamptz not null default now(),
  unique (assessment_id, sort_order)
);

create table public.assessment_rubrics (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.summative_assessments(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now()
);
create table public.assessment_rubric_criteria (
  id uuid primary key default gen_random_uuid(),
  rubric_id uuid not null references public.assessment_rubrics(id) on delete cascade,
  criterion text not null,
  descriptor text not null,
  points numeric(5,2) not null check (points >= 0),
  sort_order integer not null check (sort_order >= 0),
  unique (rubric_id, sort_order)
);

alter table public.summative_assessments enable row level security;
alter table public.summative_assessment_items enable row level security;
alter table public.assessment_rubrics enable row level security;
alter table public.assessment_rubric_criteria enable row level security;
create policy "workspace users read summative assessments" on public.summative_assessments for select to authenticated using (public.is_active_member(organization_id));
create policy "workspace users create summative assessments" on public.summative_assessments for insert to authenticated with check (public.is_active_member(organization_id) and created_by = auth.uid());
create policy "workspace users update summative assessments" on public.summative_assessments for update to authenticated using (public.is_active_member(organization_id)) with check (public.is_active_member(organization_id));
create policy "workspace users read summative assessment items" on public.summative_assessment_items for select to authenticated using (exists (select 1 from public.summative_assessments a where a.id = assessment_id and public.is_active_member(a.organization_id)));
create policy "workspace users manage summative assessment items" on public.summative_assessment_items for all to authenticated using (exists (select 1 from public.summative_assessments a where a.id = assessment_id and public.is_active_member(a.organization_id))) with check (exists (select 1 from public.summative_assessments a where a.id = assessment_id and public.is_active_member(a.organization_id)));
create policy "workspace users read rubrics" on public.assessment_rubrics for select to authenticated using (exists (select 1 from public.summative_assessments a where a.id = assessment_id and public.is_active_member(a.organization_id)));
create policy "workspace users manage rubrics" on public.assessment_rubrics for all to authenticated using (exists (select 1 from public.summative_assessments a where a.id = assessment_id and public.is_active_member(a.organization_id))) with check (exists (select 1 from public.summative_assessments a where a.id = assessment_id and public.is_active_member(a.organization_id)));
create policy "workspace users read rubric criteria" on public.assessment_rubric_criteria for select to authenticated using (exists (select 1 from public.assessment_rubrics r join public.summative_assessments a on a.id = r.assessment_id where r.id = rubric_id and public.is_active_member(a.organization_id)));
create policy "workspace users manage rubric criteria" on public.assessment_rubric_criteria for all to authenticated using (exists (select 1 from public.assessment_rubrics r join public.summative_assessments a on a.id = r.assessment_id where r.id = rubric_id and public.is_active_member(a.organization_id))) with check (exists (select 1 from public.assessment_rubrics r join public.summative_assessments a on a.id = r.assessment_id where r.id = rubric_id and public.is_active_member(a.organization_id)));

-- END 20260727000900_summative_assessment_foundation.sql

-- BEGIN 20260727001000_reference_subject_grade_seed.sql
-- Stable reference taxonomy used by plans, content, assessment and entitlements.
insert into public.subjects (code, name_ar) values
  ('history', 'التاريخ'), ('geography', 'الجغرافيا'), ('civic-education', 'التربية المدنية')
on conflict (code) do update set name_ar = excluded.name_ar;
insert into public.grade_levels (code, name_ar, sort_order) values
  ('1am', 'الأولى متوسط', 1), ('2am', 'الثانية متوسط', 2), ('3am', 'الثالثة متوسط', 3), ('4am', 'الرابعة متوسط', 4)
on conflict (code) do update set name_ar = excluded.name_ar, sort_order = excluded.sort_order;

-- END 20260727001000_reference_subject_grade_seed.sql

-- BEGIN 20260727001100_aggregated_results_interventions.sql
-- Aggregated assessment analytics. No student PII is stored in this MVP path.
create type public.intervention_type as enum ('remediation', 'enrichment');
create type public.intervention_status as enum ('planned', 'completed', 'verified', 'archived');

create table public.assessment_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  assessment_id uuid not null references public.summative_assessments(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  conducted_on date not null,
  participant_count smallint check (participant_count between 1 and 80),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create table public.aggregated_results (
  id uuid primary key default gen_random_uuid(),
  assessment_run_id uuid not null references public.assessment_runs(id) on delete cascade,
  assessment_item_id uuid references public.summative_assessment_items(id) on delete set null,
  criterion_label text not null check (char_length(trim(criterion_label)) between 3 and 300),
  assessed_count smallint not null check (assessed_count > 0),
  mastered_count smallint not null check (mastered_count between 0 and assessed_count),
  common_error text,
  created_at timestamptz not null default now()
);
create table public.error_patterns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  assessment_run_id uuid references public.assessment_runs(id) on delete set null,
  pattern text not null check (char_length(trim(pattern)) between 3 and 2000),
  evidence text not null check (char_length(trim(evidence)) between 3 and 2000),
  priority smallint not null check (priority between 1 and 3),
  created_at timestamptz not null default now()
);
create table public.interventions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  error_pattern_id uuid references public.error_patterns(id) on delete set null,
  intervention_type public.intervention_type not null,
  status public.intervention_status not null default 'planned',
  title text not null,
  activity text not null,
  duration_minutes integer not null check (duration_minutes between 5 and 180),
  success_indicator text not null,
  verification_note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger interventions_updated_at before update on public.interventions for each row execute function public.set_updated_at();

alter table public.assessment_runs enable row level security;
alter table public.aggregated_results enable row level security;
alter table public.error_patterns enable row level security;
alter table public.interventions enable row level security;
create policy "workspace users manage assessment runs" on public.assessment_runs for all to authenticated using (public.is_active_member(organization_id)) with check (public.is_active_member(organization_id));
create policy "workspace users manage aggregated results" on public.aggregated_results for all to authenticated using (exists(select 1 from public.assessment_runs r where r.id=assessment_run_id and public.is_active_member(r.organization_id))) with check (exists(select 1 from public.assessment_runs r where r.id=assessment_run_id and public.is_active_member(r.organization_id)));
create policy "workspace users manage error patterns" on public.error_patterns for all to authenticated using (public.is_active_member(organization_id)) with check (public.is_active_member(organization_id));
create policy "workspace users manage interventions" on public.interventions for all to authenticated using (public.is_active_member(organization_id)) with check (public.is_active_member(organization_id));

-- END 20260727001100_aggregated_results_interventions.sql
