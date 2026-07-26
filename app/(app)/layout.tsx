import { redirect } from "next/navigation";
import type { Route } from "next";
import { AppNavigation } from "@/components/layout/app-navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login" as Route);
  const { error } = await supabase.rpc("ensure_personal_workspace");
  if (error) throw new Error("تعذر تجهيز مساحة العمل الخاصة.");
  return <div className="min-h-screen bg-slate-50 lg:flex"><AppNavigation /><main className="mx-auto w-full max-w-7xl p-5 sm:p-8">{children}</main></div>;
}
