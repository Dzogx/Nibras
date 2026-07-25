# Module Boundaries
- `knowledge`: وثائق، إصدارات، OCR، chunks، citations.
- `planner`: أقسام، خطة، تقدم، تنفيذ مؤكد.
- `content`: موارد وإصدارات وربطها بالخطة.
- `assessment`: اختبارات، rubrics، نتائج مجمعة، interventions.
- `ai`: retrieval، prompts، providers، evaluation؛ لا يملك حقيقة تربوية مستقلة.
- `auth`: الهوية والعضويات والتخويل.
لا يجوز للمكونات العرضية تجاوز RLS أو استدعاء مفاتيح الخدمة. يمر الوصول الحساس عبر server modules.
