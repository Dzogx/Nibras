import { getReviewedReferencePack } from "@/packages/domain/reference-packs/registry";
import type { ReferenceSegment, ReferenceGrade, ReferenceSubject } from "@/packages/domain/reference-packs/types";

const normalize = (value: string) => value.toLowerCase().replace(/[إأآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[^\p{L}\p{N}\s]/gu, " ");
const tokens = (value: string) => normalize(value).split(/\s+/).filter((token) => token.length > 1);

export function searchOfficialReference(query: string, filters: { subject: ReferenceSubject; grade: ReferenceGrade }): ReferenceSegment[] {
  const queryTokens = tokens(query);
  return getReviewedReferencePack(filters.subject, filters.grade)
    .map((segment) => ({ segment, score: queryTokens.reduce((score, token) => score + Number(normalize(`${segment.title} ${segment.terminalCompetence} ${segment.resources.join(" ")}`).includes(token)), 0) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ segment }) => segment);
}
