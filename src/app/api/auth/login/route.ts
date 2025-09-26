export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";

import { loginSchema } from "@/features/auth/login/model/schema";
import type { LoginReq, LoginRes } from "@/features/auth/login/model/types";
import { httpJson, HttpError } from "@/shared/api/http";

const ACCESS_TOKEN_KEY = "access_token";

export async function POST(req: NextRequest) {
  // 1) Зчитуємо та валідовуємо тіло
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
    // ===== ЗОВНІШНІЙ БЕКЕНД (АБСОЛЮТНИЙ URL з .env) =====
    const API = (process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
    if (!API) {
      return NextResponse.json({ message: "BACKEND_API_URL не налаштовано" }, { status: 500 });
    }
    const data = await httpJson<LoginRes>(`${API}/api/auth/login`, {
      method: "POST",
      body: JSON.stringify(body),
    });

    // Очікуємо від зовнішнього бекенду: { access_token: string }
    if (!data?.access_token || typeof data.access_token !== "string") {
      return NextResponse.json({ message: "Некоректна відповідь від сервера авторизації" }, { status: 502 });
    }

    // 3) Ставимо HttpOnly cookie з токеном на наш домен
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
    // 4) Узгоджений формат помилок для mapError()
    if (error instanceof HttpError) {
      const status = error.status ?? 500;

      // Якщо зовнішній бекенд повернув fieldErrors — прокинемо далі
      const fieldErrors = error.body && typeof error.body === "object" && "fieldErrors" in error.body ? (error.body as { fieldErrors?: Record<string, string> }).fieldErrors : undefined;

      // Уніфіковане повідомлення
      const message = (error.body && (error.body as { message?: string }).message) || error.message || (status >= 500 ? "Помилка сервера авторизації" : "Невдала спроба входу");

      return NextResponse.json(
        {
          message,
          ...(fieldErrors ? { fieldErrors } : null),
        },
        { status },
      );
    }

    // Невідомі/мережеві помилки
    return NextResponse.json({ message: "Невдала спроба входу" }, { status: 500 });
  }
}
