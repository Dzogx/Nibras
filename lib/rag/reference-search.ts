import { historyGrade1Reference, type ReferenceSegment } from "@/packages/domain/reference-packs/history-grade-1";

const normalize = (value: string) => value.toLowerCase().replace(/[إأآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[^\p{L}\p{N}\s]/gu, " ");
const tokens = (value: string) => normalize(value).split(/\s+/).filter((token) => token.length > 1);

export function searchOfficialReference(query: string, filters: { subject: "history"; grade: "1am" }): ReferenceSegment[] {
  const queryTokens = tokens(query);
  return historyGrade1Reference
    .filter((segment) => segment.subject === filters.subject && segment.grade === filters.grade)
    .map((segment) => ({ segment, score: queryTokens.reduce((score, token) => score + Number(normalize(`${segment.title} ${segment.terminalCompetence} ${segment.resources.join(" ")}`).includes(token)), 0) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ segment }) => segment);
}
