# Scope Control
المصدر المرجعي للنطاق هو Implementation Blueprint. Design Freeze فعال.

## مسموح
- تنفيذ Epics وقصص الـBlueprint.
- إصلاح خلل أمني أو معماري أو تربوي مثبت.
- تحسين اختبارات أو قابلية تشغيل أو أداء ضمن الميزة المعتمدة.

## غير مسموح بلا RFC
- إضافة دور مستخدم أو مسار منتج أو تكامل خارجي جديد.
- تخزين نتائج فردية أو PII للتلاميذ في MVP.
- تغيير مصدر الحقيقة للمنهاج أو تخفيف citation gating.

## Change Control
1. يفتح Issue يصف الخطر، الدليل، البدائل، الكلفة والأثر.
2. يراجع PM + Solution Architect + Security أو Knowledge Owner حسب المجال.
3. يوثق القرار في `docs/product/decision-log.md` وADR عند الحاجة.
4. لا يدخل Sprint قائم إلا إذا كان P0.
