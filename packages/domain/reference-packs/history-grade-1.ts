export type Citation = {
  documentTitle: string;
  versionLabel: string;
  page: number;
  checksumSha256: string;
  excerpt: string;
};

export type ReferenceSegment = {
  id: string;
  subject: "history";
  grade: "1am";
  term: 1 | 2 | 3;
  title: string;
  comprehensiveCompetence: string;
  terminalCompetence: string;
  resources: string[];
  citation: Citation;
};

const documentTitle = "المخططات السنوية 2022 تاريخ السنة الأولى متوسط";
const versionLabel = "المخططات السنوية المعتمدة 2022";
const checksumSha256 = "7d385fcdb07fdd03f7071876589cc30342dacdebf7b397bfd66fc6f9d7963aef";

export const historyGrade1Reference: ReferenceSegment[] = [
  {
    id: "history-1am-term-1-historical-documents",
    subject: "history",
    grade: "1am",
    term: 1,
    title: "الوثائق التاريخية",
    comprehensiveCompetence: "إبراز قيمة الموروث التاريخي الوطني كمكون للهوية الوطنية من خلال التعرف واكتشاف المنجزات الحضارية وأساليب تكيف الإنسان مع وسطه.",
    terminalCompetence: "يوظف الآثار بشكل منهجي لوضع كرونولوجيا العصور القديمة واكتشاف نمط معيشة إنسان ما قبل التاريخ.",
    resources: ["مواطن بقايا إنسان العصور القديمة", "أنواع الآثار القديمة", "الخطوات المنهجية لدراسة الآثار", "نمط معيشة إنسان ما قبل التاريخ وقدرته على التكيف"],
    citation: { documentTitle, versionLabel, page: 5, checksumSha256, excerpt: "يوظّف الآثار بشكل منهجي لوضع كرونولوجيا العصور القديمة واكتشاف نمط معيشة إنسان ما قبل التاريخ." }
  },
  {
    id: "history-1am-term-2-national-history",
    subject: "history",
    grade: "1am",
    term: 2,
    title: "التاريخ الوطني",
    comprehensiveCompetence: "إبراز قيمة الموروث التاريخي الوطني كمكون للهوية الوطنية من خلال التعرف واكتشاف المنجزات الحضارية وأساليب تكيف الإنسان مع وسطه.",
    terminalCompetence: "يصنف المنجزات الحضارية القديمة في الجزائر وشمال إفريقيا مبرزاً دور الممالك الأمازيغية في مواجهة الاستعمار القديم.",
    resources: ["الممالك القديمة في شمال إفريقيا", "الحضارة اللوبية والبونية", "الاستعمار الثلاثي القديم", "مقاومة الاستعمار القديم"],
    citation: { documentTitle, versionLabel, page: 6, checksumSha256, excerpt: "يصّنف المنجزات الحضارية القديمة في الجزائر وشمال إفريقيا مبرزا دور الممالك الأمازيغية في مواجهة الاستعمار القديم." }
  },
  {
    id: "history-1am-term-3-general-history",
    subject: "history",
    grade: "1am",
    term: 3,
    title: "التاريخ العام",
    comprehensiveCompetence: "إبراز قيمة الموروث التاريخي الوطني كمكون للهوية الوطنية من خلال التعرف واكتشاف المنجزات الحضارية وأساليب تكيف الإنسان مع وسطه.",
    terminalCompetence: "ينطلق من منجزات الحضارات القديمة في العالم لاستخلاص عاملي التأثير والتأثر وتحديد المجالات الجغرافية لكل منها.",
    resources: ["الحضارات القديمة", "مواطن الحضارات وعوامل قيامها", "المنجزات الحضارية", "التأثير والتأثر"],
    citation: { documentTitle, versionLabel, page: 7, checksumSha256, excerpt: "الحضارات القديمة في العالم لاستخلاص عاملي التأثير والتأثر وتحديد المجالات الجغرافية لكل منها." }
  }
];
