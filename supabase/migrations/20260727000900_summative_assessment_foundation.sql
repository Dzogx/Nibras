-- Assessment Bank foundation. UI terminology: التقويم التحصيلي.
create type public.assessment_status as enum ('draft', 'reviewed', 'approved', 'archived');
create type public.cognitive_level as enum ('knowledge', 'comprehension', 'application', 'analysis', 'creation', 'evaluation');

create table public.summative_assessments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  plan_item_id uuid references public.plan_items(id) on delete set null,
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
