# Nibras | نبراس

منصة موثقة للأستاذ الخبير في الاجتماعيات للتعليم المتوسط في الجزائر. هذا المستودع ينفذ فقط النطاق المعتمد في **Version 3.0** و**Implementation Blueprint**؛ لا تقبل ميزات جديدة خارج Change Control.

## الحالة
- Sprint الحالي: **Sprint 0 — Foundation**
- لا ترفع مفاتيح أو بيانات تلاميذ أو وثائق مؤسسية إلى Git.
- لا تعد مخططات PDF مصدراً رسمياً قابلاً للجزم قبل مراجعة OCR والاعتماد داخل Knowledge Manager.

## المتطلبات
- Node.js 20+
- npm 10+
- Docker Desktop (لتشغيل Supabase محلياً)
- Supabase CLI (`npx supabase` عبر package scripts)

## التشغيل المحلي
```bash
cp .env.example .env
npm install
npm run supabase:start
# انسخ مفاتيح Supabase المحلية إلى .env ثم:
npm run dev
```
افتح `http://localhost:3000` وافحص الصحة عبر `/api/health`.

## الجودة
```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
npm run db:lint
```

## قاعدة البيانات
توجد migrations في `supabase/migrations`. لا تعدل migration نُفذت في بيئة مشتركة؛ أنشئ migration جديدة. جميع بيانات المؤسسة المستقبلية يجب أن تحتوي `organization_id` وسياسات RLS واختبارات عزل.

## الوثائق
- `docs/product/scope.md`: النطاق المجمد وChange Control.
- `docs/adr/`: قرارات معمارية.
- `docs/security/`: تصنيف البيانات والضوابط.
- `docs/knowledge/`: حوكمة الوثائق الرسمية.
- `docs/runbooks/`: أدلة التشغيل والاستجابة.

## النشر
- Development: محلي/Preview.
- Staging: مشروع Supabase وVercel مستقلان، ببيانات مجهلة فقط.
- Production: لا ينشر قبل اجتياز Quality Gates في الـImplementation Blueprint.
