// src/app/api/auth/login/route.ts
// TypeScript strict
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";

import type { LoginRes } from "@/features/auth/login/model/types";

const ACCESS_TOKEN_KEY = "access_token";
const API = (process.env.BACKEND_API_URL || "").replace(/\/+$/u, "");

type HeadersWithGetSetCookie = Headers & { getSetCookie?: () => string[] | undefined };

function safeParseJson<T>(s: string): T | null {
  try {
    return s ? (JSON.parse(s) as T) : null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  if (!API) {
    return NextResponse.json({ message: "BACKEND_API_URL не налаштовано" }, { status: 500 });
  }

  const rawBody = await req.text();

  try {
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

    if (!upstream.ok) {
      const data = isJson ? safeParseJson<{ message?: string; fieldErrors?: Record<string, string> }>(text) : null;
      const message = (data && data.message) || upstream.statusText || `HTTP ${upstream.status}`;
      const payload = data?.fieldErrors ? { message, fieldErrors: data.fieldErrors } : { message };
      const errRes = NextResponse.json(payload, { status: upstream.status });
      errRes.headers.set("cache-control", "no-store");
      return errRes;
    }

    const data = (isJson ? safeParseJson<LoginRes>(text) : null) as LoginRes | null;
    if (!data?.access_token || typeof data.access_token !== "string") {
      return NextResponse.json({ message: "Некоректна відповідь від сервера авторизації" }, { status: 502 });
    }

    const res = NextResponse.json({ ok: true }, { status: 200 });
    res.headers.set("cache-control", "no-store");

    // Наш HttpOnly access_token на домені фронта
    res.cookies.set(ACCESS_TOKEN_KEY, data.access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 годин
    });

    // Прокинемо можливі Set-Cookie з апстріма (наприклад, сесійні/refresh-куки)
    const setCookies = (upstream.headers as HeadersWithGetSetCookie).getSetCookie?.() ?? (upstream.headers.get("set-cookie") ? [upstream.headers.get("set-cookie") as string] : []);
    for (const sc of setCookies) {
      if (sc) res.headers.append("set-cookie", sc);
    }

    return res;
  } catch {
    return NextResponse.json({ message: "Невдала спроба входу" }, { status: 500 });
  }
}
