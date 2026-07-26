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
