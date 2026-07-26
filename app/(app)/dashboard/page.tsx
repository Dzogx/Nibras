import Link from "next/link";
import type { Route } from "next";

const cards = [
  ["المرجع المعتمد", "ابحث في المخططات مع الصفحة والاقتباس.", "/reference", "⌕"],
  ["إنشاء مورد", "أنشئ مسودة حصة مرتبطة بالكفاءة والمصدر.", "/studio", "✦"],
  ["Teacher OS", "أنشئ القسم والخطة وتابع ما تم إنجازه.", "/planner", "▦"]
] as const;
export default function DashboardPage() {
  return <section><p className="text-sm font-semibold text-emerald-700">مساحة عمل الأستاذ</p><h1 className="mt-1 text-3xl font-bold">مرحباً بك في نبراس</h1><p className="mt-2 max-w-2xl text-slate-600">ابدأ من المرجع المعتمد، ثم حوّل الكفاءة إلى مورد تربوي موثق وقابل للتطوير.</p>
    <div className="mt-8 grid gap-4 md:grid-cols-3">{cards.map(([title, description, href, icon]) => <Link key={title} href={href as Route} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300"><span className="text-2xl text-emerald-700">{icon}</span><h2 className="mt-4 font-bold">{title}</h2><p className="mt-2 text-sm text-slate-600">{description}</p><span className="mt-5 inline-block text-sm font-semibold text-emerald-700">فتح ←</span></Link>)}</div>
    <div className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50 p-6"><h2 className="font-bold text-emerald-950">المسار المتاح الآن</h2><p className="mt-2 text-sm text-emerald-900">تاريخ الأولى متوسط: وثيقة مرجعية → مقطع وكفاءة → اقتباس وصفحة → مسودة مورد تربوي.</p></div>
  </section>;
}
