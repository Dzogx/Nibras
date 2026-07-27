import Link from "next/link";
import type { Route } from "next";

const links = [
  { href: "/dashboard", label: "لوحة العمل", icon: "◈" },
  { href: "/reference", label: "المرجع المعتمد", icon: "⌕" },
  { href: "/studio", label: "إنشاء مورد", icon: "✦" },
  { href: "/planner", label: "الخطة والأقسام", icon: "▦" },
  { href: "/assessment", label: "التقويم التحصيلي", icon: "✓" }
];

export function AppNavigation() {
  return <aside className="no-print hidden min-h-screen w-64 shrink-0 bg-[#0d2c3b] p-5 text-white lg:block">
    <Link href="/dashboard" className="flex items-center gap-3 text-2xl font-bold"><span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-400 text-[#063c35]">ن</span>نبراس</Link>
    <p className="mr-12 mt-1 text-xs text-slate-300">منصة الإنتاج التربوي</p>
    <nav className="mt-10 space-y-2">{links.map((link) => <Link key={link.href} href={link.href as Route} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-100 transition hover:bg-emerald-800"><span>{link.icon}</span>{link.label}</Link>)}</nav>
    <p className="mt-14 text-xs text-slate-400">MVP · مساحة عمل خاصة بالأستاذ</p>
  </aside>;
}
