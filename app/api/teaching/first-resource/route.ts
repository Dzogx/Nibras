import { NextRequest, NextResponse } from "next/server";
import { historyGrade1Reference } from "@/packages/domain/reference-packs/history-grade-1";
import { createLessonDraft } from "@/lib/teaching/lesson-draft";

export function GET(request: NextRequest) {
  const segmentId = request.nextUrl.searchParams.get("segmentId") ?? "history-1am-term-1-historical-documents";
  const segment = historyGrade1Reference.find((item) => item.id === segmentId);
  if (!segment) return NextResponse.json({ error: "المقطع المرجعي غير موجود." }, { status: 404 });
  return NextResponse.json({ resource: createLessonDraft(segment) });
}
