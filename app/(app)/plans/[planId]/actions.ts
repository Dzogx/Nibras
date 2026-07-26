"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace/current-workspace";
import { getReferencePlanItems } from "@/lib/planner/reference-plan";

export async function importReferencePlanAction(planId: string): Promise<{ error?: string; imported?: number }> {
  const supabase = await createClient(); const workspaceId = await getCurrentWorkspaceId();
  const { data: plan, error: planError } = await supabase.from("annual_plans").select("id,classes(subjects(code),grade_levels(code))").eq("id", planId).eq("organization_id", workspaceId).single();
  if (planError || !plan) return { error: "الخطة غير متاحة." };
  const classInfo = Array.isArray(plan.classes) ? plan.classes[0] : plan.classes;
  const subjectCode = Array.isArray(classInfo?.subjects) ? classInfo.subjects[0]?.code : undefined;
  const gradeCode = Array.isArray(classInfo?.grade_levels) ? classInfo.grade_levels[0]?.code : undefined;
  if (!subjectCode || !gradeCode) return { error: "لا يمكن تحديد المادة أو المستوى للقسم." };
  const items = getReferencePlanItems(subjectCode, gradeCode);
  if (!items.length) return { error: "لا تتوفر بعد حزمة مرجعية مستوردة لهذه المادة والمستوى." };
  const { count, error: countError } = await supabase.from("plan_items").select("id", { count: "exact", head: true }).eq("annual_plan_id", plan.id);
  if (countError) return { error: "تعذر التحقق من بنود الخطة." };
  if ((count ?? 0) > 0) return { error: "الخطة تحتوي بالفعل على بنود؛ لا يمكن الاستيراد فوقها." };
  const { error } = await supabase.from("plan_items").insert(items.map((item) => ({ organization_id: workspaceId, annual_plan_id: plan.id, title: item.title, sort_order: item.sortOrder, planned_minutes: item.plannedMinutes, reference_metadata: item.referenceMetadata })));
  if (error) return { error: "تعذر استيراد المقاطع المرجعية." };
  revalidatePath(`/plans/${plan.id}`); return { imported: items.length };
}
