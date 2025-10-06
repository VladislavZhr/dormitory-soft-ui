// src/app/api/students/add/route.ts
// TypeScript strict
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";

function bearerFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((p) => p.trim());
  const kv = new Map(
    parts.map((p) => {
      const i = p.indexOf("=");
      return i === -1 ? [p, ""] : [p.slice(0, i), decodeURIComponent(p.slice(i + 1))];
    }),
  );
  const token = kv.get("access_token") ?? kv.get("token") ?? null;
  return token ? `Bearer ${token}` : null;
}

/**
 * POST /api/students/add
 * Проксі на: POST {BACKEND_API_URL}/api/students/add
 * Прокидує Cookie + Authorization (якщо є), повертає Set-Cookie.
 */
export async function POST(req: NextRequest) {
  const API = (process.env.BACKEND_API_URL || "").replace(/\/+$/, "");
  if (!API) {
    return NextResponse.json({ message: "BACKEND_API_URL is not set" }, { status: 500 });
  }

  const target = `${API}/api/students/add`;

  try {
    const rawBody = await req.text();
    const incomingCookie = req.headers.get("cookie");
    const incomingAuth = req.headers.get("authorization");
    const bearer = incomingAuth || bearerFromCookieHeader(incomingCookie);

    const upstream = await fetch(target, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        cookie: incomingCookie ?? "",
        ...(bearer ? { authorization: bearer } : {}),
      },
      body: rawBody || "{}",
      cache: "no-store",
      signal: req.signal,
    });

    const contentType = upstream.headers.get("content-type") || "";
    const text = await upstream.text();
    const parsed = contentType.includes("application/json") ? safeJson(text) : text;

    const headers = new Headers({ "cache-control": "no-store" });
    if (!contentType.includes("application/json") && contentType) {
      headers.set("content-type", contentType);
    }

    const setCookie = (upstream.headers as unknown as { getSetCookie?: () => string[] | undefined }).getSetCookie?.() ?? upstream.headers.get("set-cookie");
    if (Array.isArray(setCookie)) {
      setCookie.forEach((sc) => headers.append("set-cookie", sc));
    } else if (typeof setCookie === "string" && setCookie) {
      headers.set("set-cookie", setCookie);
    }

    if (contentType.includes("application/json")) {
      return NextResponse.json(parsed, { status: upstream.status, headers });
    }

    return new NextResponse(typeof parsed === "string" ? parsed : String(parsed), {
      status: upstream.status,
      headers,
    });
  } catch {
    return NextResponse.json({ message: "Upstream fetch failed" }, { status: 502 });
  }
}

function safeJson<T = unknown>(s: string): T | object {
  try {
    return s ? (JSON.parse(s) as T) : {};
  } catch {
    return {};
  }
}
