import { getReviewedReferencePack } from "@/packages/domain/reference-packs/registry";

export type ReferencePlanItem = { title: string; sortOrder: number; plannedMinutes: number; referenceMetadata: Record<string, unknown> };

export function getReferencePlanItems(subjectCode: string, gradeCode: string): ReferencePlanItem[] {
  const pack = getReviewedReferencePack(subjectCode as "history" | "geography" | "civic-education", gradeCode as "1am" | "2am" | "3am" | "4am");
  return pack.map((segment, index) => ({
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
