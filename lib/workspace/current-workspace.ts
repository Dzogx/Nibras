import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentWorkspaceId(): Promise<string> {
  const supabase = await createClient();
  const { data: workspace, error } = await supabase.rpc("ensure_personal_workspace");
  if (error || !workspace) throw new Error("تعذر الوصول إلى مساحة العمل الخاصة.");
  return (workspace as { id: string }).id;
}
