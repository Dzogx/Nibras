import { describe, expect, it } from "vitest";
import { canConfirmLessonRun, getNextTeachingStep } from "@/lib/planner/next-step";
describe("Teacher OS next step", () => {
  const items = [
    { id: "a", sortOrder: 1, title: "منفذ", status: "completed" as const, scheduledOn: null },
    { id: "b", sortOrder: 2, title: "التالي", status: "planned" as const, scheduledOn: null },
    { id: "c", sortOrder: 3, title: "لاحق", status: "planned" as const, scheduledOn: null }
  ];
  it("selects the first incomplete planned item", () => expect(getNextTeachingStep(items)?.id).toBe("b"));
  it("requires a valid duration and non-completed item for confirmation", () => {
    expect(canConfirmLessonRun(items[1], 55)).toBe(true);
    expect(canConfirmLessonRun(items[0], 55)).toBe(false);
    expect(canConfirmLessonRun(items[1], 0)).toBe(false);
  });
});
