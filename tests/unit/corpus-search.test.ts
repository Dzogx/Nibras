import { describe, expect, it } from "vitest";
import { searchAnnualPlanCorpus } from "@/lib/rag/corpus-search";
describe("annual plans reference corpus", () => {
  it("retrieves a cited geography page with grade filtering", () => {
    const results = searchAnnualPlanCorpus("المخاطر الكبرى في الجزائر", { subject: "geography", grade: "4am" });
    expect(results[0]).toMatchObject({ subject: "geography", grade: "4am" });
    expect(results.some((result) => result.page === 7)).toBe(true);
    expect(results[0].checksumSha256).toHaveLength(64);
  });
  it("does not return another subject when a subject filter is present", () => {
    expect(searchAnnualPlanCorpus("الحوار", { subject: "history", grade: "1am" })).toEqual([]);
  });
});
