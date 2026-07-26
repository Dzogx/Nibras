export type Capability =
  | "content.read"
  | "content.generate"
  | "assessment.create"
  | "teacher_os.plan"
  | "resource.export";

export type AccessContext = {
  capability: Capability;
  subjectId?: string;
  gradeLevelId?: string;
  academicYearId?: string;
  now?: Date;
};

export type AccessGrant = {
  id: string;
  status: "active" | "suspended" | "expired" | "revoked";
  capability: Capability;
  subjectId: string | null;
  gradeLevelId: string | null;
  academicYearId: string | null;
  startsAt: Date;
  endsAt: Date | null;
  usageLimit: number | null;
  usageUsed?: number;
};

export type AccessDecision =
  | { allowed: true; grantId: string; reason: "active-grant" | "internal-access" }
  | { allowed: false; reason: "no-matching-grant" | "inactive-grant" | "expired-grant" | "usage-limit-reached" };

function scopeMatches(grantValue: string | null, contextValue: string | undefined): boolean {
  return grantValue === null || grantValue === contextValue;
}

export function decideAccess(grants: AccessGrant[], context: AccessContext): AccessDecision {
  const now = context.now ?? new Date();
  const matching = grants.filter((grant) =>
    grant.capability === context.capability &&
    scopeMatches(grant.subjectId, context.subjectId) &&
    scopeMatches(grant.gradeLevelId, context.gradeLevelId) &&
    scopeMatches(grant.academicYearId, context.academicYearId)
  );
  if (matching.length === 0) return { allowed: false, reason: "no-matching-grant" };

  for (const grant of matching) {
    if (grant.status !== "active") continue;
    if (grant.startsAt > now || (grant.endsAt !== null && grant.endsAt <= now)) continue;
    if (grant.usageLimit !== null && (grant.usageUsed ?? 0) >= grant.usageLimit) continue;
    return { allowed: true, grantId: grant.id, reason: "active-grant" };
  }

  if (matching.some((grant) => grant.usageLimit !== null && (grant.usageUsed ?? 0) >= grant.usageLimit)) return { allowed: false, reason: "usage-limit-reached" };
  if (matching.some((grant) => grant.endsAt !== null && grant.endsAt <= now)) return { allowed: false, reason: "expired-grant" };
  return { allowed: false, reason: "inactive-grant" };
}
