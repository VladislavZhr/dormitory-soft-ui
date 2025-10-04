// src/app/api/inventory/audits/[id]/route.ts
// TypeScript strict
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

const BACKEND = (process.env.BACKEND_API_URL || process.env.BACKEND_URL || "").replace(/\/+$/, "");

// Переносимо auth/cookie з вхідного запиту
function pickAuthHeaders(req: NextRequest) {
  const h = new Headers();
  const auth = req.headers.get("authorization");
  if (auth) h.set("authorization", auth);
  const cookie = req.headers.get("cookie");
  if (cookie) h.set("cookie", cookie);
  return h;
}

// Проксі кількох Set-Cookie (Node runtime підтримує getSetCookie)
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
      headers: {
        accept: "application/json",
        ...Object.fromEntries(pickAuthHeaders(req).entries()),
      },
      cache: "no-store",
      signal: req.signal,
      redirect: "manual",
    });

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
      headers: {
        accept: "application/json",
        ...Object.fromEntries(pickAuthHeaders(req).entries()),
      },
      cache: "no-store",
      signal: req.signal,
      redirect: "manual",
    });

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
  } catch (e) {
    return NextResponse.json({ message: "Upstream fetch failed", detail: String(e) }, { status: 502 });
  }
}
