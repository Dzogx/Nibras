"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace/current-workspace";

const planSchema = z.object({ classId: z.string().uuid(), title: z.string().trim().min(3).max(200) });
export async function createAnnualPlanAction(_state: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  const parsed = planSchema.safeParse({ classId: formData.get("classId"), title: formData.get("title") });
  if (!parsed.success) return { error: "اختر القسم وأدخل عنواناً صالحاً للخطة." };
  const supabase = await createClient(); const workspaceId = await getCurrentWorkspaceId();
  const { data: { user } } = await supabase.auth.getUser(); if (!user) return { error: "انتهت الجلسة." };
  const { data: classRow, error: classError } = await supabase.from("classes").select("id,academic_year_id").eq("id", parsed.data.classId).eq("organization_id", workspaceId).single();
  if (classError || !classRow) return { error: "القسم غير متاح في مساحة العمل." };
  const { data: plan, error } = await supabase.from("annual_plans").insert({ organization_id: workspaceId, class_id: classRow.id, academic_year_id: classRow.academic_year_id, title: parsed.data.title, created_by: user.id }).select("id").single();
  if (error || !plan) return { error: "تعذر إنشاء الخطة. قد تكون هناك خطة سابقة لهذا القسم." };
  revalidatePath("/planner"); redirect(`/plans/${plan.id}` as Route);
}
