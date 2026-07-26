import { LoginForm } from "@/components/auth/login-form";
export default function LoginPage() {
  return <main className="mx-auto max-w-md p-6 sm:pt-20"><h1 className="text-3xl font-bold">تسجيل الدخول إلى نبراس</h1><p className="mt-3 text-slate-700">استخدم رابط دخول آمن. لا تطلب المنصة كلمة مرور ولا بيانات تلاميذ.</p><LoginForm /></main>;
}
