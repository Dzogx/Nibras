"use client";
import { useState } from "react";
import { completeIntervention } from "@/app/(app)/analytics/[runId]/intervention-action";
export function InterventionStatus({runId,id,status}:{runId:string;id:string;status:string}){const[loading,setLoading]=useState(false);if(status!=="planned")return <span className="text-xs text-emerald-700">مكتمل</span>;return <button onClick={async()=>{setLoading(true);await completeIntervention(runId,id);setLoading(false)}} disabled={loading} className="mt-2 rounded bg-emerald-700 px-2 py-1 text-xs text-white">{loading?"جارٍ…":"تأكيد إنجاز التدخل"}</button>}
