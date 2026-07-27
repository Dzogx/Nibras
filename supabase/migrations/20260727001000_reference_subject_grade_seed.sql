-- Stable reference taxonomy used by plans, content, assessment and entitlements.
insert into public.subjects (code, name_ar) values
  ('history', 'التاريخ'), ('geography', 'الجغرافيا'), ('civic-education', 'التربية المدنية')
on conflict (code) do update set name_ar = excluded.name_ar;
insert into public.grade_levels (code, name_ar, sort_order) values
  ('1am', 'الأولى متوسط', 1), ('2am', 'الثانية متوسط', 2), ('3am', 'الثالثة متوسط', 3), ('4am', 'الرابعة متوسط', 4)
on conflict (code) do update set name_ar = excluded.name_ar, sort_order = excluded.sort_order;
