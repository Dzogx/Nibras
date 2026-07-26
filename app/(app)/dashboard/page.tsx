import { redirect } from "next/navigation";
import type { Route } from "next";
import { createClient } from "@/lib/supabase/server";
export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login" as Route);
  const { error: workspaceError } = await supabase.rpc("ensure_personal_workspace");
  if (workspaceError) throw new Error("تعذر تجهيز مساحة العمل الخاصة.");
  return <main className="mx-auto max-w-5xl p-8"><h1 className="text-3xl font-bold">لوحة نبراس</h1><p className="mt-3 text-slate-700">تم التحقق من الجلسة. ستظهر خطة الأستاذ ووثائقه المعتمدة في المراحل التالية.</p></main>;
}
