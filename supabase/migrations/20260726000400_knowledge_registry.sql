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
