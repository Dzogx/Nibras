import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "نبراس | الأستاذ الخبير في الاجتماعيات", description: "منصة تربوية موثقة للتعليم المتوسط في الجزائر" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl"><body>{children}</body></html>;
}
