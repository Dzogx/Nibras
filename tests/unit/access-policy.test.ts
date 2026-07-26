import { describe, expect, it } from "vitest";
import { decideAccess, type AccessGrant } from "@/lib/access/policy";
const now = new Date("2026-09-01T00:00:00.000Z");
const gradeOneGrant: AccessGrant = { id: "trial-1", status: "active", capability: "content.generate", subjectId: "history", gradeLevelId: "1am", academicYearId: "2026-2027", startsAt: new Date("2026-08-01"), endsAt: new Date("2027-07-31"), usageLimit: 10, usageUsed: 0 };
describe("AccessPolicy", () => {
  it("allows an active scoped grant", () => expect(decideAccess([gradeOneGrant], { capability: "content.generate", subjectId: "history", gradeLevelId: "1am", academicYearId: "2026-2027", now })).toMatchObject({ allowed: true, grantId: "trial-1" }));
  it("does not allow a grant for another grade", () => expect(decideAccess([gradeOneGrant], { capability: "content.generate", subjectId: "history", gradeLevelId: "2am", academicYearId: "2026-2027", now })).toEqual({ allowed: false, reason: "no-matching-grant" }));
  it("denies an exhausted usage grant", () => expect(decideAccess([{ ...gradeOneGrant, usageUsed: 10 }], { capability: "content.generate", subjectId: "history", gradeLevelId: "1am", academicYearId: "2026-2027", now })).toEqual({ allowed: false, reason: "usage-limit-reached" }));
  it("allows a feature-wide grant with null scopes", () => expect(decideAccess([{ ...gradeOneGrant, id: "all", subjectId: null, gradeLevelId: null, academicYearId: null, capability: "teacher_os.plan", usageLimit: null }], { capability: "teacher_os.plan", now })).toMatchObject({ allowed: true, grantId: "all" }));
});
