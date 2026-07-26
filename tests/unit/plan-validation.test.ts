import { describe, expect, it } from "vitest";
import { validatePlanItems } from "@/lib/planner/plan-validation";
describe("plan item validation", () => {
  it("accepts ordered plan items", () => expect(validatePlanItems([{ title: "الوثائق التاريخية", sortOrder: 0, plannedMinutes: 55 }, { title: "إدماج الموارد", sortOrder: 1, plannedMinutes: 55 }])).toEqual([]));
  it("rejects duplicate order and invalid duration", () => expect(validatePlanItems([{ title: "مورد أول", sortOrder: 0, plannedMinutes: 0 }, { title: "مورد ثان", sortOrder: 0, plannedMinutes: 55 }]).length).toBeGreaterThan(0));
});
