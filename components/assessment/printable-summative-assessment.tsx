"use client";

type Question = { title: string; points: number; content: React.ReactNode };
type Section = { subject: string; points: number; simpleQuestions: Question[]; integration: { points: number; context: string; documents: string[]; instruction: string } };

function Header({ title }: { title: string }) {
  return <header className="assessment-header"><div><b>مديرية التربية لولاية: __________</b><br />المؤسسة: ____________________</div><div className="assessment-title"><b>{title}</b><span>السنة الدراسية: ____ / ____</span></div><div>المستوى: الرابعة متوسط<br />المدة: ساعة ونصف</div></header>;
}
function SubjectPage({ section, page }: { section: Section; page: number }) {
  return <article className="assessment-sheet"><Header title="التقويم التحصيلي" /><div className="assessment-subject"><b>المادة: {section.subject}</b><b>{section.points} نقطة</b></div><h2>الجزء الأول: الوضعيات البسيطة</h2>{section.simpleQuestions.map((question, index) => <section className="assessment-question" key={question.title}><div className="assessment-question-title"><b>الوضعية {index + 1}</b><span>{question.points} ن</span></div><div>{question.content}</div></section>)}<h2>الجزء الثاني: الوضعية الإدماجية</h2><section className="assessment-integration"><p><b>السياق:</b> {section.integration.context}</p><div className="assessment-documents"><b>السندات:</b>{section.integration.documents.map((document) => <p key={document}>• {document}</p>)}</div><p><b>التعليمة:</b> {section.integration.instruction}</p></section><footer>الصفحة {page}/2 <span>بالتوفيق والنجاح</span></footer></article>;
}

export function PrintableSummativeAssessment() {
  const history: Section = { subject: "التاريخ", points: 13, simpleQuestions: [
    { title: "الوضعية الأولى", points: 4, content: <p>رتب الأحداث التاريخية الآتية حسب التسلسل الزمني، ثم حدد تاريخ كل حدث.</p> },
    { title: "الوضعية الثانية", points: 3, content: <p>صنف الوثائق المعطاة في جدول حسب نوعها، مع تعليل مختصر.</p> },
    { title: "الوضعية الثالثة", points: 2, content: <p>حلل الوثيقة المعطاة واستخرج منها معلومة تاريخية مدعماً إجابتك بما درست.</p> }
  ], integration: { points: 4, context: "أثناء نقاش حول مصداقية الأحداث التاريخية، طلب منك زميلك بيان دور الوثيقة التاريخية في إثبات الحقائق.", documents: ["سند نصي أو وثيقة تاريخية مناسبة.", "خريطة أو خط زمني أو معطيات داعمة عند الحاجة."], instruction: "اعتماداً على السندات ومكتسباتك، اكتب فقرة منظمة توضح أهمية الوثيقة التاريخية ومراحل دراستها." } };
  const geography: Section = { subject: "الجغرافيا", points: 7, simpleQuestions: [
    { title: "الوضعية الأولى", points: 2, content: <p>عرف المصطلحين الجغرافيين الآتيين تعريفاً دقيقاً.</p> },
    { title: "الوضعية الثانية", points: 2, content: <p>صنف المظاهر الجغرافية المعطاة في جدول مناسب، ثم سمّ معيار التصنيف.</p> }
  ], integration: { points: 3, context: "خلال رحلة مدرسية لاحظتم تغيراً في الغطاء النباتي والخصائص الطبيعية بين الأقاليم الجغرافية.", documents: ["خريطة أو جدول أو رسم بياني وظيفي.", "معطيات مرتبطة بالسياق."], instruction: "اعتماداً على السندات ومكتسباتك، فسر الظاهرة في فقرة منظمة من ستة أسطر تقريباً." } };
  return <div className="print-preview"><div className="no-print print-toolbar"><button onClick={() => window.print()}>طباعة أو حفظ PDF</button><p>قالب معاينة قابل للتعديل. النقاط وفق بنية الرابعة متوسط: تاريخ 9+4، جغرافيا 4+3.</p></div><SubjectPage section={history} page={1} /><SubjectPage section={geography} page={2} /></div>;
}
