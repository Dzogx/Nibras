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
