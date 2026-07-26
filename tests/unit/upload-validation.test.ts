import { describe, expect, it } from "vitest";
import { validateKnowledgeUpload } from "@/lib/knowledge/upload-validation";
describe("knowledge upload validation", () => {
  it("accepts an in-policy PDF", () => expect(validateKnowledgeUpload({ name: "plan.pdf", type: "application/pdf", size: 1024 })).toEqual({ ok: true }));
  it("rejects unsupported types", () => expect(validateKnowledgeUpload({ name: "malware.exe", type: "application/octet-stream", size: 1024 }).ok).toBe(false));
  it("rejects oversized files", () => expect(validateKnowledgeUpload({ name: "large.pdf", type: "application/pdf", size: 51 * 1024 * 1024 }).ok).toBe(false));
});
