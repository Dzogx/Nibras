import { describe, expect, it } from "vitest";
import { getQueuedReferenceDocument, getReferenceImportProgress } from "@/lib/knowledge/import/manifest";
describe("annual plans import manifest", () => {
  it("contains all twelve annual-plan references", () => expect(getReferenceImportProgress()).toEqual({ total: 12, activated: 1, queued: 11 }));
  it("keeps each queued document bound to its checksum and candidate source pages", () => {
    const document = getQueuedReferenceDocument("civic-education", "4am");
    expect(document?.sha256).toHaveLength(64);
    expect(document?.candidateCompetencePages.length).toBeGreaterThan(0);
  });
});
