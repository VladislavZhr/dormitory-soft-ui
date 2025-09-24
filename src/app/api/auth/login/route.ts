export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";

import { loginSchema } from "@/features/auth/login/model/schema";
import type { LoginReq, LoginRes } from "@/features/auth/login/model/types";
import { http } from "@/shared/api/http";

const ACCESS_TOKEN_KEY = "access_token";

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = loginSchema.safeParse(json);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const e of parsed.error.issues) {
      const path = e.path.join(".") || "_root";
      if (!fieldErrors[path]) fieldErrors[path] = e.message;
    }
    return NextResponse.json({ message: "Помилка валідації", fieldErrors }, { status: 400 });
  }

  const body: LoginReq = parsed.data;

  try {
    // Зовнішній бекенд: /auth/login -> { access_token: string }
    const data = await http.post<LoginReq, LoginRes>("/api/auth/login", body);

    const res = NextResponse.json({ ok: true }, { status: 200 });
    res.cookies.set(ACCESS_TOKEN_KEY, data.access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 год
    });
    return res;
  } catch (error) {
    // Узагальнена відповідь у форматі, зручному для mapError
    return NextResponse.json(
      {
        message: (error as Error)?.message ?? "Невдала спроба входу",
        fieldErrors: {
          username: "Перевірте логін",
          password: "Перевірте пароль",
        },
      },
      { status: 401 },
    );
  }
}
