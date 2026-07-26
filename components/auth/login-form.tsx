"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
    if (error) { setState("error"); setMessage("تعذر إرسال رابط الدخول. تحقق من البريد أو أعد المحاولة."); return; }
    setState("sent"); setMessage("أرسلنا رابط دخول آمن إلى بريدك الإلكتروني.");
  }

  return <form onSubmit={signIn} className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
    <label className="block text-sm font-medium" htmlFor="email">البريد الإلكتروني</label>
    <input id="email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2" dir="ltr" />
    <button disabled={state === "sending"} className="w-full rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-50" type="submit">
      {state === "sending" ? "جارٍ الإرسال…" : "إرسال رابط الدخول"}
    </button>
    {message && <p role="status" className={state === "error" ? "text-sm text-red-700" : "text-sm text-emerald-700"}>{message}</p>}
  </form>;
}
