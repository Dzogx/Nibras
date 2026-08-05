create type public.assessment_item_kind as enum ('simple', 'integrative');
alter table public.summative_assessment_items add column item_kind public.assessment_item_kind not null default 'simple';
alter table public.summative_assessment_items add column context text;
alter table public.summative_assessment_items add column sources jsonb not null default '[]'::jsonb;
alter table public.summative_assessment_items add column expected_output text;
