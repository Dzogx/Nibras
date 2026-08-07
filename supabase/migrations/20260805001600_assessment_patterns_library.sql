create type public.assessment_pattern_kind as enum ('formative_test','summative_term','remedial','bem_practice');
create type public.pattern_evidence_level as enum ('official','field_observed','advisory');
create table public.assessment_patterns (id uuid primary key default gen_random_uuid(), grade_level_id uuid references public.grade_levels(id), assessment_domain public.assessment_domain not null, pattern_kind public.assessment_pattern_kind not null, term_number smallint check(term_number between 1 and 3), title text not null, rules jsonb not null, evidence_level public.pattern_evidence_level not null, source_label text not null, active boolean not null default true, created_at timestamptz not null default now());
alter table public.assessment_patterns enable row level security;
create policy "read assessment patterns" on public.assessment_patterns for select to authenticated using(true);
