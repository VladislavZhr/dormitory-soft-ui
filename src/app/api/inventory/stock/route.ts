// src/app/api/inventory/stock/route.ts
// TypeScript strict
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

const BACKEND = (process.env.BACKEND_URL || "").replace(/\/+$/u, "");

type HeadersWithGetSetCookie = Headers & { getSetCookie?: () => string[] | undefined };

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

function buildForwardHeaders(req: NextRequest): Headers {
  const incomingCookie = req.headers.get("cookie");
  const incomingAuth = req.headers.get("authorization");
  const accept = req.headers.get("accept");
  const contentType = req.headers.get("content-type");

  const h = new Headers();
  if (accept) h.set("accept", accept);
  if (contentType) h.set("content-type", contentType);
  if (incomingCookie) h.set("cookie", incomingCookie);

  const bearer = incomingAuth || bearerFromCookieHeader(incomingCookie);
  if (bearer) h.set("authorization", bearer);

  return h;
}

async function proxy(req: NextRequest, method: "GET" | "POST" | "PUT" | "PATCH"): Promise<Response> {
  if (!BACKEND) {
    return NextResponse.json({ error: "Env BACKEND_URL is not set" }, { status: 500 });
  }

  const upstream = `${BACKEND}/inventory/stock`;
  const headers = buildForwardHeaders(req);

  // --- зчитуємо body тільки для методів із тілом
  const hasBody = method !== "GET";
  let bodyText: string | undefined;

  if (hasBody) {
    const txt = await req.text();
    bodyText = txt.length ? txt : undefined;
    // якщо content-type JSON і body порожній — не вигадуємо {}, лишаємо як undefined
    // далі ми НЕ передамо undefined у fetch (див. нижче)
  }

  // --- будуємо RequestInit без порушення exactOptionalPropertyTypes
  const baseInit: RequestInit = {
    method,
    headers,
    signal: req.signal,
    cache: "no-store",
  };

  // Якщо тіла немає — взагалі не додаємо поле body.
  // Якщо є — додаємо string; якщо явно порожнє для методів з тілом — кладемо null.
  const init: RequestInit = hasBody ? (bodyText !== undefined ? { ...baseInit, body: bodyText } : { ...baseInit, body: null }) : baseInit;

  const r = await fetch(upstream as RequestInfo, init);

  const out = new NextResponse(r.body, { status: r.status });
  out.headers.set("cache-control", "no-store");

  const ct = r.headers.get("content-type");
  if (ct) out.headers.set("content-type", ct);

  const setCookie = (r.headers as HeadersWithGetSetCookie).getSetCookie?.() ?? r.headers.get("set-cookie");
  if (Array.isArray(setCookie)) {
    for (const c of setCookie) out.headers.append("set-cookie", c);
  } else if (typeof setCookie === "string" && setCookie) {
    out.headers.set("set-cookie", setCookie);
  }

  return out;
}

// GET /api/inventory/stock
export async function GET(req: NextRequest): Promise<Response> {
  return proxy(req, "GET");
}

// POST /api/inventory/stock
export async function POST(req: NextRequest): Promise<Response> {
  return proxy(req, "POST");
}

// PUT /api/inventory/stock
export async function PUT(req: NextRequest): Promise<Response> {
  return proxy(req, "PUT");
}

// PATCH /api/inventory/stock
export async function PATCH(req: NextRequest): Promise<Response> {
  return proxy(req, "PATCH");
}
