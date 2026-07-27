import { describe, expect, it } from "vitest";
import { getQueuedReferenceDocument, getReferenceImportProgress } from "@/lib/knowledge/import/manifest";
describe("annual plans import manifest", () => {
  it("tracks the active reviewed packs against the twelve annual-plan references", () => expect(getReferenceImportProgress()).toEqual({ total: 12, activated: 12, queued: 0 }));
  it("keeps each queued document bound to its checksum and candidate source pages", () => {
    const document = getQueuedReferenceDocument("civic-education", "4am");
    expect(document?.sha256).toHaveLength(64);
    expect(document?.candidateCompetencePages.length).toBeGreaterThan(0);
  });
});
