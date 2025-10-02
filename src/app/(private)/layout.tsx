// src/app/(private)/layout.tsx
import RequireAuth from "@/features/auth/login/guards/RequireAuth";

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
