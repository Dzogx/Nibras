import { describe, expect, it } from "vitest";
import { getAssessmentStructure } from "@/lib/assessment/structure-policy";
describe("official fourth-grade assessment structure", () => {
  it("uses 9+4 for history", () => expect(getAssessmentStructure("4am", "history").parts.map((part) => part.points)).toEqual([9, 4]));
  it("uses 4+3 for geography", () => expect(getAssessmentStructure("4am", "geography").parts.map((part) => part.points)).toEqual([4, 3]));
  it("uses 12+8 for civic education", () => expect(getAssessmentStructure("4am", "civic-education").parts.map((part) => part.points)).toEqual([12, 8]));
});
