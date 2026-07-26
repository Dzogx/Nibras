"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/workspace/current-workspace";

const classSchema = z.object({ name: z.string().trim().min(1).max(100), learnerCount: z.coerce.number().int().min(1).max(80), subjectId: z.string().uuid(), gradeLevelId: z.string().uuid(), academicYearId: z.string().uuid() });

export async function createClassAction(_previousState: { error?: string; success?: true }, formData: FormData): Promise<{ error?: string; success?: true }> {
  const parsed = classSchema.safeParse({ name: formData.get("name"), learnerCount: formData.get("learnerCount"), subjectId: formData.get("subjectId"), gradeLevelId: formData.get("gradeLevelId"), academicYearId: formData.get("academicYearId") });
  if (!parsed.success) return { error: "تحقق من بيانات القسم والسنة والمادة والمستوى." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "انتهت الجلسة. أعد تسجيل الدخول." };
  const organizationId = await getCurrentWorkspaceId();
  const { error } = await supabase.from("classes").insert({ organization_id: organizationId, academic_year_id: parsed.data.academicYearId, subject_id: parsed.data.subjectId, grade_level_id: parsed.data.gradeLevelId, name: parsed.data.name, learner_count: parsed.data.learnerCount, created_by: user.id });
  if (error) return { error: "تعذر حفظ القسم. حاول مرة أخرى." };
  revalidatePath("/planner");
  return { success: true };
}
