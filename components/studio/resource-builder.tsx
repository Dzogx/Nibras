"use client";

import { useEffect, useState } from "react";

type Segment = { id: string; title: string; terminalCompetence: string; term: number };
const subjects = [{ value: "history", label: "التاريخ" }, { value: "geography", label: "الجغرافيا" }, { value: "civic-education", label: "التربية المدنية" }];
const grades = [{ value: "1am", label: "الأولى متوسط" }, { value: "2am", label: "الثانية متوسط" }, { value: "3am", label: "الثالثة متوسط" }, { value: "4am", label: "الرابعة متوسط" }];

export function ResourceBuilder() {
  const [subject, setSubject] = useState("history");
  const [grade, setGrade] = useState("1am");
  const [segments, setSegments] = useState<Segment[]>([]);
  const [segmentId, setSegmentId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/teaching/segments?subject=${subject}&grade=${grade}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => {
        const nextSegments = data.segments ?? [];
        setSegments(nextSegments);
        setSegmentId(nextSegments[0]?.id ?? "");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSegments([]);
        setSegmentId("");
      });
    return () => controller.abort();
  }, [subject, grade]);

  async function createResource() {
    if (!segmentId) return;
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/content/lesson-drafts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ segmentId }) });
    const data = await response.json();
    if (response.ok) { window.location.assign(`/studio/${data.id}`); return; }
    setMessage(data.error ?? "تعذر إنشاء المورد.");
    setLoading(false);
  }

  const selectedSegment = segments.find((segment) => segment.id === segmentId);
  return <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm">المادة<select value={subject} onChange={(event) => setSubject(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 p-2">{subjects.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      <label className="text-sm">المستوى<select value={grade} onChange={(event) => setGrade(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 p-2">{grades.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
    </div>
    {segments.length ? <><label className="mt-4 block text-sm">المقطع المرجعي<select value={segmentId} onChange={(event) => setSegmentId(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 p-2">{segments.map((segment) => <option key={segment.id} value={segment.id}>الفصل {segment.term}: {segment.title}</option>)}</select></label><p className="mt-3 text-sm text-slate-600">{selectedSegment?.terminalCompetence}</p><button onClick={createResource} disabled={loading} className="mt-5 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{loading ? "جارٍ الإنشاء…" : "إنشاء مسودة مورد موثق"}</button></> : <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">لا توجد حزمة مرجعية مفعلة لهذا الاختيار.</p>}
    {message && <p className="mt-3 text-sm text-red-700">{message}</p>}
  </div>;
}
