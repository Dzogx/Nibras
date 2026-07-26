export type ReferenceSubject = "history" | "geography" | "civic-education";
export type ReferenceGrade = "1am" | "2am" | "3am" | "4am";
export type Citation = { documentTitle: string; versionLabel: string; page: number; checksumSha256: string; excerpt: string };
export type ReferenceSegment = { id: string; subject: ReferenceSubject; grade: ReferenceGrade; term: 1 | 2 | 3; title: string; comprehensiveCompetence: string; terminalCompetence: string; resources: string[]; citation: Citation };
