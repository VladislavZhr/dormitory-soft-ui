// src/app/api/inventory/stock/route.ts
// TypeScript strict
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

// Єдиний env, прибрані лишні слеші в кінці
const BACKEND = (process.env.BACKEND_API_URL || "").replace(/\/+$/, "");

// ——— helpers ———————————————————————————————————————————————
type HeadersWithGetSetCookie = Headers & { getSetCookie?: () => string[] };

function pickAuthHeaders(req: NextRequest) {
  const h = new Headers();
  const auth = req.headers.get("authorization");
  if (auth) h.set("authorization", auth);
  const cookie = req.headers.get("cookie");
  if (cookie) h.set("cookie", cookie);
  return h;
}

function forwardSetCookies(upstream: Response, out: NextResponse) {
  // Якщо у платформі доступний getSetCookie() — збережемо всі куки
  const getSetCookie = (upstream.headers as HeadersWithGetSetCookie).getSetCookie?.bind(upstream.headers);
  if (typeof getSetCookie === "function") {
    for (const c of getSetCookie()) out.headers.append("set-cookie", c);
  } else {
    const one = upstream.headers.get("set-cookie");
    if (one) out.headers.append("set-cookie", one);
  }
}

function exposeCommon(out: NextResponse) {
  out.headers.set("access-control-expose-headers", "Content-Type, Content-Length, ETag, Last-Modified, Set-Cookie");
  out.headers.set("cache-control", "no-store");
  return out;
}

// ——— GET /api/inventory/stock → {BACKEND}/inventory/stock ————————————————
export async function GET(req: NextRequest) {
  if (!BACKEND) {
    return NextResponse.json({ message: "Env BACKEND_API_URL is not set" }, { status: 500 });
  }

  const { search } = new URL(req.url);
  const upstreamUrl = `${BACKEND}/api/inventory/stock${search || ""}`;

  const headers = pickAuthHeaders(req);
  headers.set("accept", "application/json");

  let r: Response;
  try {
    r = await fetch(upstreamUrl, {
      method: "GET",
      headers,
      cache: "no-store",
      signal: req.signal,
      redirect: "manual",
    });
  } catch (e) {
    return NextResponse.json({ message: "Upstream fetch failed", detail: String(e) }, { status: 502 });
  }

  // Стрімимо тіло як є
  const out = new NextResponse(r.body, {
    status: r.status,
    headers: {
      "content-type": r.headers.get("content-type") || "application/json; charset=utf-8",
    },
  });

  forwardSetCookies(r, out);
  return exposeCommon(out);
}

// ——— POST /api/inventory/stock → {BACKEND}/inventory/stock ————————————————
export async function POST(req: NextRequest) {
  if (!BACKEND) {
    return NextResponse.json({ message: "Env BACKEND_API_URL is not set" }, { status: 500 });
  }

  // Просто прокидуємо JSON як є (валідацію робите на клієнті або на бекенді)
  const bodyText = await req.text();

  const headers = pickAuthHeaders(req);
  headers.set("accept", "application/json");
  headers.set("content-type", "application/json");

  let r: Response;
  try {
    r = await fetch(`${BACKEND}/api/inventory/stock`, {
      method: "POST",
      headers,
      body: bodyText,
      cache: "no-store",
      signal: req.signal,
      redirect: "manual",
    });
  } catch (e) {
    return NextResponse.json({ message: "Upstream fetch failed", detail: String(e) }, { status: 502 });
  }

  const out = new NextResponse(r.body, {
    status: r.status,
    headers: {
      "content-type": r.headers.get("content-type") || "application/json; charset=utf-8",
    },
  });

  forwardSetCookies(r, out);
  return exposeCommon(out);
}
