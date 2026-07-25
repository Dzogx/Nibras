# Incident Runbook (MVP)
1. صنف الحادث: P0 تسرب/عزل بيانات، P1 تعطل أساسي، P2 خلل محدود.
2. أوقف feature flag أو endpoint المتأثر، ولا تحذف أدلة audit.
3. أخطر PM وSecurity؛ وثق الوقت والنطاق والحسابات المتأثرة.
4. عالج/استعد في staging عند الإمكان، ثم نفذ rollback أو forward fix.
5. نفذ postmortem خلال 5 أيام عمل: السبب، الأثر، الإجراء الوقائي والمالك.
