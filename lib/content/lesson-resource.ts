import type { LessonDraft } from "@/lib/teaching/lesson-draft";

export type LessonResourceBody = {
  targetedCompetence: string;
  learningIntention: string;
  evidenceOfLearning: string;
  activity: LessonDraft["activity"];
  formativeAssessment: string;
  source: LessonDraft["source"];
};

export function validateLessonResource(resource: LessonResourceBody): string[] {
  const errors: string[] = [];
  if (!resource.targetedCompetence.trim()) errors.push("الكفاءة المستهدفة إلزامية.");
  if (!resource.evidenceOfLearning.trim()) errors.push("دليل الإتقان إلزامي.");
  if (!resource.activity.instruction.trim() || resource.activity.durationMinutes <= 0) errors.push("النشاط وتعليماته وزمنه إلزامية.");
  if (!resource.formativeAssessment.trim()) errors.push("التقويم التكويني إلزامي.");
  if (!resource.source.documentTitle || resource.source.page <= 0 || resource.source.checksumSha256.length !== 64) errors.push("مصدر موثق بصفحة وبصمة إلزامي.");
  return errors;
}

export function toLessonResourceBody(draft: LessonDraft): LessonResourceBody {
  return { targetedCompetence: draft.targetedCompetence, learningIntention: draft.learningIntention, evidenceOfLearning: draft.evidenceOfLearning, activity: draft.activity, formativeAssessment: draft.formativeAssessment, source: draft.source };
}
