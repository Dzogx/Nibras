export type PlanItemInput = { title: string; sortOrder: number; plannedMinutes?: number | null };

export function validatePlanItems(items: PlanItemInput[]): string[] {
  const errors: string[] = [];
  const orders = new Set<number>();
  for (const item of items) {
    if (item.title.trim().length < 3) errors.push("عنوان بند الخطة يجب أن يتكون من 3 أحرف على الأقل.");
    if (!Number.isInteger(item.sortOrder) || item.sortOrder < 0) errors.push("ترتيب بند الخطة غير صالح.");
    if (orders.has(item.sortOrder)) errors.push("لا يمكن تكرار ترتيب بنود الخطة.");
    orders.add(item.sortOrder);
    if (item.plannedMinutes !== undefined && item.plannedMinutes !== null && (!Number.isInteger(item.plannedMinutes) || item.plannedMinutes < 5 || item.plannedMinutes > 600)) errors.push("زمن بند الخطة يجب أن يكون بين 5 و600 دقيقة.");
  }
  return [...new Set(errors)];
}
