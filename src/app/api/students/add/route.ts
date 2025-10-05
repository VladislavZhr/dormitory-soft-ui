// src/app/api/students/add/route.ts
// TypeScript strict
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";

/**
 * POST /api/students/add
 * Проксі на: POST {BACKEND_API_URL}/api/students/add
 * Передаємо cookies, сире JSON-тіло, повертаємо тіло/статус/Set-Cookie.
 */
export async function POST(req: NextRequest) {
  const API = (process.env.BACKEND_API_URL || "").replace(/\/+$/, "");
  if (!API) {
    return NextResponse.json({ message: "BACKEND_API_URL is not set" }, { status: 500 });
  }

  const target = `${API}/api/students/add`;

  try {
    // Беремо сирий текст, щоб не втрачати оригінальний payload (exactOptionalPropertyTypes-safe)
    const rawBody = await req.text();

    const upstream = await fetch(target, {
      method: "POST",
      // Важливо: передаємо cookies і правильні заголовки
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        cookie: req.headers.get("cookie") ?? "",
      },
      body: rawBody || "{}",
      cache: "no-store",
      signal: req.signal,
    });

    const contentType = upstream.headers.get("content-type") || "";
    const text = await upstream.text();
    const body = contentType.includes("application/json") ? safeJson(text) : text;

    // Проксіюємо Set-Cookie (якщо є) + забороняємо кеш
    const headers = new Headers({ "cache-control": "no-store" });
    const setCookie = upstream.headers.get("set-cookie");
    if (setCookie) headers.append("set-cookie", setCookie);

    return NextResponse.json(body, {
      status: upstream.status,
      headers,
    });
  } catch {
    return NextResponse.json({ message: "Upstream fetch failed" }, { status: 502 });
  }
}

// Акуратний JSON.parse без викидання помилки
function safeJson<T = unknown>(s: string): T | object {
  try {
    return s ? (JSON.parse(s) as T) : {};
  } catch {
    return {};
  }
}
