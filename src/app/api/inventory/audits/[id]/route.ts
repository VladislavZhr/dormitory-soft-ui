// src/app/api/inventory/audits/[id]/route.ts
// TypeScript strict
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

const BACKEND = (process.env.BACKEND_API_URL || process.env.BACKEND_URL || "").replace(/\/+$/, "");

// Заголовки авторизації/кук з вхідного запиту
function pickAuthHeaders(req: NextRequest) {
  const h = new Headers();
  const auth = req.headers.get("authorization");
  if (auth) h.set("authorization", auth);
  const cookie = req.headers.get("cookie");
  if (cookie) h.set("cookie", cookie);
  return h;
}

// Проксі кількох Set-Cookie без any
type HeadersWithGetSetCookie = Headers & { getSetCookie?: () => string[] };
function forwardSetCookies(upstream: Response, out: NextResponse) {
  const h = upstream.headers as HeadersWithGetSetCookie;
  if (typeof h.getSetCookie === "function") {
    for (const c of h.getSetCookie()) out.headers.append("set-cookie", c);
  } else {
    const one = upstream.headers.get("set-cookie");
    if (one) out.headers.append("set-cookie", one);
  }
}

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  if (!BACKEND) {
    return NextResponse.json({ message: "Env BACKEND_API_URL is not set" }, { status: 500 });
  }

  // валідація id (опційно, але корисно)
  const rawId = ctx.params?.id ?? "";
  const numId = Number(rawId);
  if (!Number.isFinite(numId) || numId <= 0) {
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }

  // переносимо query string як є
  const { search } = new URL(req.url);
  const upstreamUrl = `${BACKEND}/inventory/audits/${encodeURIComponent(rawId)}${search || ""}`;

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

  // Віддаємо тіло/статус як є (стрім)
  const out = new NextResponse(r.body, {
    status: r.status,
    headers: {
      "content-type": r.headers.get("content-type") || "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-expose-headers": "Content-Type, Content-Length, ETag, Last-Modified, Set-Cookie",
    },
  });

  forwardSetCookies(r, out);
  return out;
}
