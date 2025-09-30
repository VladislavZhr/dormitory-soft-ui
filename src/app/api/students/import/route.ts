// src/app/api/students/import/route.ts
// TypeScript strict
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";

/**
 * POST /api/students/import
 * Проксі на: POST {BACKEND_API_URL}/api/students/import
 * - Приймає multipart/form-data
 * - Проксить файл(и) та інші поля як є
 * - Прокидує cookies до бекенда і назад (Set-Cookie)
 * - Вимикає кешування
 */
export async function POST(req: NextRequest) {
  const API = (process.env.BACKEND_API_URL || "").replace(/\/+$/, "");
  if (!API) {
    return NextResponse.json({ message: "BACKEND_API_URL is not set" }, { status: 500 });
  }

  const target = `${API}/api/students/import`;

  try {
    // Зчитуємо FormData з запиту
    const inForm = await req.formData();

    // Збираємо новий FormData (важливо не виставляти content-type самим)
    const outForm = new FormData();
    for (const [key, value] of inForm.entries()) {
      if (value instanceof File) {
        // Зберігаємо ім'я файлу
        outForm.append(key, value, value.name);
      } else {
        outForm.append(key, value);
      }
    }

    const upstream = await fetch(target, {
      method: "POST",
      body: outForm, // Content-Type з boundary проставить fetch сам
      headers: {
        accept: "application/json",
        cookie: req.headers.get("cookie") ?? "",
      },
      cache: "no-store",
      signal: req.signal,
    });

    const contentType = upstream.headers.get("content-type") || "";
    const text = await upstream.text();
    const body = contentType.includes("application/json") ? safeJson(text) : text;

    // Готуємо заголовки відповіді: не кешувати + прокинемо всі Set-Cookie
    const headers = new Headers({ "cache-control": "no-store" });
    upstream.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        headers.append("set-cookie", value);
      }
    });

    return NextResponse.json(body as unknown, {
      status: upstream.status,
      headers,
    });
  } catch {
    return NextResponse.json({ message: "Upstream fetch failed" }, { status: 502 });
  }
}

// Безпечний JSON.parse без кидання помилки
function safeJson(s: string): unknown {
  try {
    return s ? JSON.parse(s) : null;
  } catch {
    return {};
  }
}
