import LoginForm from "@/features/auth/login/ui/LoginForm";

export const dynamic = "force-static";

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50">
      <LoginForm />
    </main>
  );
}
