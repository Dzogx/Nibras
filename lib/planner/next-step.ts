export type PlanItemStatus = "planned" | "in_progress" | "completed" | "needs_intervention" | "deferred";
export type PlanItem = { id: string; sortOrder: number; title: string; status: PlanItemStatus; scheduledOn: string | null };

export function getNextTeachingStep(items: PlanItem[]): PlanItem | null {
  return items
    .filter((item) => item.status === "planned" || item.status === "in_progress" || item.status === "needs_intervention")
    .sort((a, b) => a.sortOrder - b.sortOrder)[0] ?? null;
}

export function canConfirmLessonRun(item: PlanItem, actualMinutes: number): boolean {
  return item.status !== "completed" && Number.isInteger(actualMinutes) && actualMinutes > 0 && actualMinutes <= 600;
}
