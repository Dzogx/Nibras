-- Seed current user-confirmed national assessment rules.
with rule_set as (
  insert into public.national_rule_sets (name, effective_from, source_label, status)
  values ('قواعد التقويم التحصيلي المعتمدة 2026-2027', '2026-09-01', 'المخططات والأدلة المرفقة وتوضيحات الأستاذ', 'active')
  returning id
), grades as (
  select id, code from public.grade_levels
)
insert into public.national_assessment_rules (
  rule_set_id, grade_level_id, assessment_domain, duration_minutes, total_points,
  distribution, bloom_lower_ratio, bloom_upper_ratio
)
select rule_set.id, grades.id, 'social_studies'::public.assessment_domain, 90, 20,
  case grades.code
    when '4am' then '{"history":13,"geography":7,"history_structure":[4,3,2,4],"geography_structure":[2,2,3],"supports":"integrative_only"}'::jsonb
    else '{"history":10,"geography":10,"supports":"integrative_only"}'::jsonb
  end,
  0.60, 0.40
from rule_set cross join grades;

with current_rule_set as (
  select id from public.national_rule_sets
  where name = 'قواعد التقويم التحصيلي المعتمدة 2026-2027'
  order by created_at desc limit 1
), grades as (
  select id from public.grade_levels
)
insert into public.national_assessment_rules (
  rule_set_id, grade_level_id, assessment_domain, duration_minutes, total_points,
  distribution, bloom_lower_ratio, bloom_upper_ratio
)
select current_rule_set.id, grades.id, 'civic_education'::public.assessment_domain, 60, 20,
  '{"structure":"simple_and_integrative","supports":"integrative_only"}'::jsonb,
  0.60, 0.40
from current_rule_set cross join grades;
