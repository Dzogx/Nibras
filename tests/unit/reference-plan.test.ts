import { describe, expect, it } from "vitest";
import { getReferencePlanItems } from "@/lib/planner/reference-plan";
describe("reference plan mapping", () => {
  it("maps the supported history first-grade reference to three ordered plan items", () => {
    const items = getReferencePlanItems("history", "1am");
    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({ title: "الوثائق التاريخية", sortOrder: 0, plannedMinutes: 55 });
    expect(items[0].referenceMetadata).toHaveProperty("citation");
  });
  it("does not invent a plan for an unsupported reference scope", () => expect(getReferencePlanItems("unknown", "1am")).toEqual([]));
});
