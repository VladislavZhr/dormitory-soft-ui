import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ACCESS_TOKEN_KEY } from "../config/constants";

export default async function RequireAuth({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_TOKEN_KEY)?.value;
  if (!token) {
    redirect("/api/auth/login");
  }
  return <>{children}</>;
}
