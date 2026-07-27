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
