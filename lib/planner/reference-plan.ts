import { historyGrade1Reference } from "@/packages/domain/reference-packs/history-grade-1";

export type ReferencePlanItem = { title: string; sortOrder: number; plannedMinutes: number; referenceMetadata: Record<string, unknown> };

export function getReferencePlanItems(subjectCode: string, gradeCode: string): ReferencePlanItem[] {
  if (subjectCode !== "history" || gradeCode !== "1am") return [];
  return historyGrade1Reference.map((segment, index) => ({
    title: segment.title,
    sortOrder: index,
    plannedMinutes: 55,
    referenceMetadata: {
      source: "user-confirmed-reference-pack",
      referenceSegmentId: segment.id,
      term: segment.term,
      terminalCompetence: segment.terminalCompetence,
      citation: segment.citation
    }
  }));
}
