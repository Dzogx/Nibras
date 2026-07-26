import corpus from "@/knowledge-imports/annual-plans-2022-corpus.json";

export type CorpusSubject = "history" | "geography" | "civic-education";
export type CorpusGrade = "1am" | "2am" | "3am" | "4am";
export type CorpusSearchResult = { subject: CorpusSubject; grade: CorpusGrade; title: string; versionLabel: string; checksumSha256: string; page: number; excerpt: string; score: number };

const normalize = (value: string) => value.toLowerCase().replace(/[إأآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[^\p{L}\p{N}\s]/gu, " ");
const tokens = (value: string) => normalize(value).split(/\s+/).filter((token) => token.length > 1);
function excerpt(text: string, match: string): string { const normalizedText = normalize(text); const index = normalizedText.indexOf(match); if (index < 0) return text.slice(0, 380); const start = Math.max(0, index - 110); return text.slice(start, start + 430); }

export function searchAnnualPlanCorpus(query: string, filters?: { subject?: CorpusSubject; grade?: CorpusGrade }): CorpusSearchResult[] {
  const queryTokens = tokens(query); if (!queryTokens.length) return [];
  const results: CorpusSearchResult[] = [];
  for (const document of corpus.documents) {
    if (filters?.subject && document.subject !== filters.subject) continue;
    if (filters?.grade && document.grade !== filters.grade) continue;
    for (const page of document.pages) {
      const normalizedPage = normalize(page.text); const score = queryTokens.reduce((value, token) => value + Number(normalizedPage.includes(token)), 0);
      if (score > 0) results.push({ subject: document.subject as CorpusSubject, grade: document.grade as CorpusGrade, title: document.title, versionLabel: document.versionLabel, checksumSha256: document.sha256, page: page.page, excerpt: excerpt(page.text, queryTokens[0]), score });
    }
  }
  return results.sort((a, b) => b.score - a.score || a.page - b.page).slice(0, 8);
}
