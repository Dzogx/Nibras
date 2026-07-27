import { describe, expect, it } from "vitest";
import { analyzeMastery, treatmentSuggestion } from "@/lib/analytics/mastery";

describe("aggregated mastery analytics", () => {
  it("prioritizes a low-mastery criterion for remediation", () => {
    const [insight] = analyzeMastery([{ criterion: "قراءة الوثيقة", assessedCount: 40, masteredCount: 16, commonError: "خلط المصدر بالمضمون" }]);
    expect(insight).toMatchObject({ masteryRate: 40, priority: "high", recommendation: "remediation" });
    expect(treatmentSuggestion(insight)).toMatchObject({ durationMinutes: 15 });
  });
  it("suggests enrichment for high mastery", () => {
    const [insight] = analyzeMastery([{ criterion: "ترتيب الأحداث", assessedCount: 40, masteredCount: 38 }]);
    expect(insight.recommendation).toBe("enrichment");
  });
});
