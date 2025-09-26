export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";

import type { LoginRes } from "@/features/auth/login/model/types";

const ACCESS_TOKEN_KEY = "access_token";

export async function POST(req: NextRequest) {
  if (req.method !== "POST") {
    return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
  }

  // 1) Зчитуємо тіло БЕЗ валідації (валідація перенесена у client.ts)
  const rawBody = await req.text();

  // 2) URL зовнішнього бекенду
  const API = (process.env.BACKEND_API_URL || "").replace(/\/+$/, "");
  if (!API) {
    return NextResponse.json({ message: "BACKEND_API_URL не налаштовано" }, { status: 500 });
  }

  try {
    // 3) Проксі-запит на зовнішній бекенд (без httpJson)
    const upstream = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: rawBody || "{}",
      cache: "no-store",
      signal: req.signal,
    });

    const contentType = upstream.headers.get("content-type") || "";
    const text = await upstream.text();
    const isJson = contentType.includes("application/json");

    const parseJson = <T>(s: string): T | null => {
      try {
        return s ? (JSON.parse(s) as T) : null;
      } catch {
        return null;
      }
    };

    // 4) Помилка від зовнішнього бекенду → прозоро віддаємо {message, fieldErrors?}
    if (!upstream.ok) {
      const data = isJson ? parseJson<{ message?: string; fieldErrors?: Record<string, string> }>(text) : null;
      const message = (data && data.message) || upstream.statusText || `HTTP ${upstream.status}`;
      const payload = data?.fieldErrors ? { message, fieldErrors: data.fieldErrors } : { message };
      return NextResponse.json(payload, { status: upstream.status });
    }

    // 5) Успіх: очікуємо { access_token }
    const data = (isJson ? parseJson<LoginRes>(text) : null) as LoginRes | null;
    if (!data?.access_token || typeof data.access_token !== "string") {
      return NextResponse.json({ message: "Некоректна відповідь від сервера авторизації" }, { status: 502 });
    }

    // 6) Ставимо HttpOnly cookie на наш домен
    const res = NextResponse.json({ ok: true }, { status: 200 });
    res.cookies.set(ACCESS_TOKEN_KEY, data.access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 годин
    });
    return res;
  } catch {
    // 7) Невідомі/мережеві помилки
    return NextResponse.json({ message: "Невдала спроба входу" }, { status: 500 });
  }
}
