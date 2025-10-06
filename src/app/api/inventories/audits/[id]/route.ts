// src/app/api/inventories/audits/[id]/route.ts
// TypeScript strict
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

const BACKEND = (process.env.BACKEND_API_URL || process.env.BACKEND_URL || "").replace(/\/+$/u, "");

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

// Переносимо auth/cookie з вхідного запиту (додаємо Bearer з куки, якщо Authorization відсутній)
function pickAuthHeaders(req: NextRequest): Headers {
  const h = new Headers();
  const cookie = req.headers.get("cookie");
  const incomingAuth = req.headers.get("authorization");
  const bearer = incomingAuth || bearerFromCookieHeader(cookie);
  if (cookie) h.set("cookie", cookie);
  if (bearer) h.set("authorization", bearer);
  const accept = req.headers.get("accept");
  if (accept) h.set("accept", accept);
  return h;
}

// Проксі кількох Set-Cookie (Node runtime підтримує getSetCookie)
function forwardSetCookies(upstream: Response, out: NextResponse) {
  const h = upstream.headers as HeadersWithGetSetCookie;
  const many = h.getSetCookie?.();
  if (Array.isArray(many)) {
    many.forEach((c) => out.headers.append("set-cookie", c));
    return;
  }
  const one = upstream.headers.get("set-cookie");
  if (one) out.headers.append("set-cookie", one);
}

function upstreamUrlFor(id: string, search = "") {
  // ⚠️ бекенд очікує /api/inventories/audits/:id
  return `${BACKEND}/api/inventories/audits/${encodeURIComponent(id)}${search || ""}`;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!BACKEND) {
    return NextResponse.json({ message: "Env BACKEND_API_URL is not set" }, { status: 500 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ message: "Missing id" }, { status: 400 });
  }

  const { search } = new URL(req.url);
  const url = upstreamUrlFor(id, search);

  try {
    const r = await fetch(url, {
      method: "GET",
      headers: pickAuthHeaders(req),
      cache: "no-store",
      signal: req.signal,
      redirect: "manual",
    });

    const out = new NextResponse(r.body, {
      status: r.status,
    });

    out.headers.set("cache-control", "no-store");

    const ct = r.headers.get("content-type");
    if (ct) out.headers.set("content-type", ct);

    out.headers.set("access-control-expose-headers", "Content-Type, Content-Length, ETag, Last-Modified, Set-Cookie");

    forwardSetCookies(r, out);
    return out;
  } catch (e) {
    return NextResponse.json({ message: "Upstream fetch failed", detail: String(e) }, { status: 502 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!BACKEND) {
    return NextResponse.json({ message: "Env BACKEND_API_URL is not set" }, { status: 500 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ message: "Missing id" }, { status: 400 });
  }

  const { search } = new URL(req.url);
  const url = upstreamUrlFor(id, search);

  try {
    const r = await fetch(url, {
      method: "DELETE",
      headers: pickAuthHeaders(req),
      cache: "no-store",
      signal: req.signal,
      redirect: "manual",
    });

    const out = new NextResponse(r.body, {
      status: r.status,
    });

    out.headers.set("cache-control", "no-store");

    const ct = r.headers.get("content-type");
    if (ct) out.headers.set("content-type", ct);

    out.headers.set("access-control-expose-headers", "Content-Type, Content-Length, ETag, Last-Modified, Set-Cookie");

    forwardSetCookies(r, out);
    return out;
  } catch (e) {
    return NextResponse.json({ message: "Upstream fetch failed", detail: String(e) }, { status: 502 });
  }
}
