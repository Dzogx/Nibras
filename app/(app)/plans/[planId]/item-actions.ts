"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace/current-workspace";

const schema = z.object({ title: z.string().trim().min(3).max(300), minutes: z.coerce.number().int().min(5).max(600) });
export type PlanItemActionState = { error?: string; ok?: boolean };
export async function addPlanItem(planId: string, _state: PlanItemActionState, formData: FormData): Promise<PlanItemActionState> {
  const parsed = schema.safeParse({ title: formData.get("title"), minutes: formData.get("minutes") });
  if (!parsed.success) return { error: "تحقق من عنوان البند وزمنه." };
  const supabase = await createClient(); const workspaceId = await getCurrentWorkspaceId();
  const { data: plan } = await supabase.from("annual_plans").select("id").eq("id", planId).eq("organization_id", workspaceId).single();
  if (!plan) return { error: "الخطة غير متاحة." };
  const { count } = await supabase.from("plan_items").select("id", { count: "exact", head: true }).eq("annual_plan_id", planId);
  const { error } = await supabase.from("plan_items").insert({ organization_id: workspaceId, annual_plan_id: planId, title: parsed.data.title, planned_minutes: parsed.data.minutes, sort_order: count ?? 0 });
  if (error) return { error: "تعذر حفظ بند الخطة." };
  revalidatePath(`/plans/${planId}`); return { ok: true };
}
