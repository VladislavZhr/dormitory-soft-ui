// src/app/(private)/_guards/RequireAuth.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ACCESS_TOKEN_KEY } from "../../../../shared/config/constants";

export default async function RequireAuth({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_TOKEN_KEY)?.value;

  if (!token) {
    // Редірект на публічну сторінку логіну
    redirect("/auth/login");
  }

  return <>{children}</>;
}
