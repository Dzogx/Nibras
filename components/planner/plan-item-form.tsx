"use client";
import { useActionState } from "react";
import { addPlanItem, type PlanItemActionState } from "@/app/(app)/plans/[planId]/item-actions";
export function PlanItemForm({ planId }: { planId: string }) {
  const action = addPlanItem.bind(null, planId);
  const initialState: PlanItemActionState = {};
  const [state, formAction, pending] = useActionState(action, initialState);
  return <form action={formAction} className="mt-4 flex flex-wrap gap-2 rounded-lg bg-slate-50 p-3"><input name="title" required placeholder="عنوان بند أو حصة" className="min-w-56 flex-1 rounded-md border border-slate-300 p-2 text-sm"/><input name="minutes" required type="number" min="5" max="600" defaultValue="55" className="w-24 rounded-md border border-slate-300 p-2 text-sm"/><button disabled={pending} className="rounded-md bg-slate-800 px-3 py-2 text-sm text-white">إضافة بند</button>{state.error&&<span className="w-full text-xs text-red-700">{state.error}</span>}</form>;
}
