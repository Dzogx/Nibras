-- Retains source provenance while a plan item is created from a reviewed reference pack.
alter table public.plan_items add column reference_metadata jsonb not null default '{}'::jsonb;
create index plan_items_reference_metadata_idx on public.plan_items using gin(reference_metadata);
