-- A summative assessment belongs to either Social Studies (history + geography) or Civic Education.
create type public.assessment_domain as enum ('social_studies', 'civic_education');
alter table public.summative_assessments add column assessment_domain public.assessment_domain not null default 'social_studies';
