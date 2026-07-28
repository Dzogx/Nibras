-- WARNING: Use only in the empty Nibras staging project.
-- Removes Nibras database objects. The existing private-documents bucket is retained
-- because Supabase requires Storage API calls for object deletion.

drop policy if exists "deny direct storage reads by default" on storage.objects;
drop policy if exists "deny direct storage writes by default" on storage.objects;

drop table if exists public.assessment_rubric_criteria cascade;
drop table if exists public.assessment_rubrics cascade;
drop table if exists public.summative_assessment_items cascade;
drop table if exists public.aggregated_results cascade;
drop table if exists public.assessment_runs cascade;
drop table if exists public.interventions cascade;
drop table if exists public.error_patterns cascade;
drop table if exists public.summative_assessments cascade;
drop table if exists public.access_usage_events cascade;
drop table if exists public.access_grants cascade;
drop table if exists public.content_citations cascade;
drop table if exists public.content_versions cascade;
drop table if exists public.content_items cascade;
drop table if exists public.memory_events cascade;
drop table if exists public.lesson_runs cascade;
drop table if exists public.plan_items cascade;
drop table if exists public.annual_plans cascade;
drop table if exists public.classes cascade;
drop table if exists public.knowledge_review_tasks cascade;
drop table if exists public.document_subjects cascade;
drop table if exists public.document_chunks cascade;
drop table if exists public.document_pages cascade;
drop table if exists public.document_versions cascade;
drop table if exists public.official_documents cascade;
drop table if exists public.curriculum_segments cascade;
drop table if exists public.curriculum_versions cascade;
drop table if exists public.academic_years cascade;
drop table if exists public.grade_levels cascade;
drop table if exists public.subjects cascade;
drop table if exists public.audit_events cascade;
drop table if exists public.memberships cascade;
drop table if exists public.profiles cascade;
drop table if exists public.organizations cascade;

drop function if exists public.handle_new_user() cascade;
drop function if exists public.create_organization_with_owner(text, text) cascade;
drop function if exists public.ensure_personal_workspace() cascade;
drop function if exists public.is_active_member(uuid) cascade;
drop function if exists public.has_organization_role(uuid, public.app_role[]) cascade;
drop function if exists public.set_updated_at() cascade;

drop type if exists public.cognitive_level cascade;
drop type if exists public.assessment_status cascade;
drop type if exists public.intervention_status cascade;
drop type if exists public.intervention_type cascade;
drop type if exists public.access_grant_source cascade;
drop type if exists public.access_grant_status cascade;
drop type if exists public.content_status cascade;
drop type if exists public.content_item_type cascade;
drop type if exists public.document_type cascade;
drop type if exists public.document_status cascade;
drop type if exists public.memory_event_type cascade;
drop type if exists public.plan_item_status cascade;
drop type if exists public.audit_action cascade;
drop type if exists public.membership_status cascade;
drop type if exists public.app_role cascade;
