import manifest from "@/knowledge-imports/annual-plans-2022-manifest.json";

export type ImportManifestEntry = { subject: "history" | "geography" | "civic-education"; grade: "1am" | "2am" | "3am" | "4am"; pages: number; sha256: string; sourceFile: string; candidateCompetencePages: number[] };
export function getQueuedReferenceDocument(subject: ImportManifestEntry["subject"], grade: ImportManifestEntry["grade"]): ImportManifestEntry | undefined {
  return (manifest.documents as ImportManifestEntry[]).find((document) => document.subject === subject && document.grade === grade);
}
export function getReferenceImportProgress(): { total: number; queued: number; activated: number } {
  const total = manifest.documents.length;
  // One reference path is activated only after a verified structured pack exists.
  return { total, activated: 1, queued: total - 1 };
}
