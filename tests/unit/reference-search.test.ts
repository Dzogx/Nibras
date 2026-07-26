import { describe, expect, it } from "vitest";
import { searchOfficialReference } from "@/lib/rag/reference-search";
import { createLessonDraft } from "@/lib/teaching/lesson-draft";
describe("official reference path", () => {
  it("retrieves the first-year historical documents segment with a page citation", () => {
    const [result] = searchOfficialReference("الآثار ونمط معيشة إنسان ما قبل التاريخ", { subject: "history", grade: "1am" });
    expect(result.id).toBe("history-1am-term-1-historical-documents");
    expect(result.citation.page).toBe(5);
    expect(result.citation.checksumSha256).toHaveLength(64);
  });
  it("creates a teaching draft grounded in the retrieved competence", () => {
    const [result] = searchOfficialReference("الآثار", { subject: "history", grade: "1am" });
    const resource = createLessonDraft(result);
    expect(resource.targetedCompetence).toBe(result.terminalCompetence);
    expect(resource.source.page).toBe(5);
    expect(resource.activity.durationMinutes).toBeGreaterThan(0);
  });
});
