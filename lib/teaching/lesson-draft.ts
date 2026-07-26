import type { ReferenceSegment } from "@/packages/domain/reference-packs/history-grade-1";

export type LessonDraft = {
  title: string;
  targetedCompetence: string;
  learningIntention: string;
  evidenceOfLearning: string;
  activity: { instruction: string; durationMinutes: number; expectedProduct: string };
  formativeAssessment: string;
  source: ReferenceSegment["citation"];
};

export function createLessonDraft(segment: ReferenceSegment): LessonDraft {
  return {
    title: `حصة تمهيدية: ${segment.title}`,
    targetedCompetence: segment.terminalCompetence,
    learningIntention: `أتعرف الموارد الأساسية لمقطع ${segment.title} وأستعملها في مهمة تاريخية بسيطة.`,
    evidenceOfLearning: `ينجز المتعلم منتجاً منظماً يوظف على الأقل موردين من موارد المقطع: ${segment.resources.slice(0, 2).join("، ")}.`,
    activity: {
      instruction: `في مجموعات من 4 إلى 5، صنفوا البطاقات أو الوثائق المتاحة وفق صلتها بموضوع «${segment.title}»، ثم عللوا اختياركم بجملة واحدة لكل بطاقة.`,
      durationMinutes: 18,
      expectedProduct: "جدول تصنيف قصير مع تعليلين مدعومين بموارد المقطع."
    },
    formativeAssessment: "بطاقة خروج: اذكر مورداً واحداً من المقطع واشرح في سطر كيف يساعد على تحقيق الكفاءة المستهدفة.",
    source: segment.citation
  };
}
