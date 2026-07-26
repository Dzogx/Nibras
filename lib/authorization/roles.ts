export const roles = ["teacher", "subject_coordinator", "inspector", "school_manager", "knowledge_editor", "platform_admin"] as const;
export type AppRole = (typeof roles)[number];

const managementRoles: readonly AppRole[] = ["school_manager", "platform_admin"];
export function canManageOrganization(role: AppRole): boolean {
  return managementRoles.includes(role);
}
