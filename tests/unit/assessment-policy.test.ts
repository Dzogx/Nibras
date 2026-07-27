import { describe, expect, it } from "vitest";
import { getHistoryGeographyAllocation, validateAllocation } from "@/lib/assessment/scoring-policy";
import { instructionMatchesLevel } from "@/lib/assessment/cognitive-levels";
describe("summative assessment policy", () => {
  it("uses 10/10 for first through third grade", () => expect(getHistoryGeographyAllocation("3am")).toEqual([{ subject: "history", points: 10 }, { subject: "geography", points: 10 }]));
  it("uses 13/7 for fourth grade", () => expect(getHistoryGeographyAllocation("4am")).toEqual([{ subject: "history", points: 13 }, { subject: "geography", points: 7 }]));
  it("detects an invalid fourth-grade allocation", () => expect(validateAllocation([{ subject: "history", points: 10 }, { subject: "geography", points: 10 }], "4am")).toHaveLength(2));
  it("matches a pedagogical action verb to its cognitive level", () => expect(instructionMatchesLevel("حلل الوثيقة التاريخية", "analysis")).toBe(true));
});
