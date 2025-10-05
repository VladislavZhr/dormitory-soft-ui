// src/app/api/inventory/export/assigned.xlsx/route.ts
// TypeScript strict
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse, type NextRequest } from "next/server";

/**
 * GET /api/inventory/export/assigned.xlsx
 * Проксі: тягнемо файл з бекенда і віддаємо як є (стрімом).
 */
export async function GET(req: NextRequest) {
  const API = (process.env.BACKEND_API_URL || "").replace(/\/+$/, "");
  if (!API) {
    return NextResponse.json({ message: "BACKEND_API_URL is not set" }, { status: 500 });
  }

  // Проксі query-параметрів як є
  const { search } = new URL(req.url);
  const target = `${API}/api/inventory/export/assigned.xlsx${search || ""}`;

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: "GET",
      // Прокидуємо cookie (для сесій) та приймаємо будь-який тип (файл)
      headers: {
        cookie: req.headers.get("cookie") ?? "",
        accept: "*/*",
      },
      cache: "no-store",
      redirect: "manual",
      signal: req.signal,
      // credentials тут не потрібні — це серверний запит Next до бекенда
    });
  } catch (e) {
    return NextResponse.json({ message: "Upstream fetch failed", detail: String(e) }, { status: 502 });
  }

  // Якщо бекенд повернув помилку — прокинемо статус і тіло як текст/бінар
  if (!upstream.ok) {
    // Спробуємо віддати тіло так, як є (може бути text/json)
    const errHeaders = new Headers();
    const ct = upstream.headers.get("content-type");
    if (ct) errHeaders.set("content-type", ct);
    // не кешуємо
    errHeaders.set("cache-control", "no-store");
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: errHeaders,
    });
  }

  // Зберемо корисні заголовки файлу
  const headers = new Headers();
  copyHeader(upstream.headers, headers, "content-type");
  copyHeader(upstream.headers, headers, "content-length");
  copyHeader(upstream.headers, headers, "content-disposition"); // filename
  copyHeader(upstream.headers, headers, "etag");
  copyHeader(upstream.headers, headers, "last-modified");

  // Не кешувати
  headers.set("cache-control", "no-store");

  // Дамо фронту можливість читати заголовки (на випадок fetch + читання filename)
  headers.set("access-control-expose-headers", "Content-Disposition, Content-Type, Content-Length, ETag, Last-Modified");

  // Якщо бек виставляє Set-Cookie — прокинемо (може бути кілька)
  const setCookies = upstream.headers.getSetCookie?.() ?? [];
  for (const sc of setCookies) headers.append("set-cookie", sc);

  // Віддаємо стрімом тіло файлу 1:1
  return new NextResponse(upstream.body, {
    status: 200,
    headers,
  });
}

function copyHeader(from: Headers, to: Headers, name: string) {
  const v = from.get(name);
  if (v) to.set(name, v);
}
