import { describe, expect, it } from "vitest";
import { canManageOrganization } from "@/lib/authorization/roles";
describe("organization role authorization", () => {
  it("allows management only to management roles", () => {
    expect(canManageOrganization("school_manager")).toBe(true);
    expect(canManageOrganization("platform_admin")).toBe(true);
    expect(canManageOrganization("teacher")).toBe(false);
    expect(canManageOrganization("inspector")).toBe(false);
  });
});
