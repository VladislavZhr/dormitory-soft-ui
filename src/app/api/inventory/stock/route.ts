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

// GET /api/inventory/stock
export async function GET(req: NextRequest): Promise<Response> {
  if (!BACKEND) {
    return NextResponse.json({ error: "Env BACKEND_URL is not set" }, { status: 500 });
  }

  const upstream = `${BACKEND}/inventory/stock`;

  const incomingCookie = req.headers.get("cookie");
  const incomingAuth = req.headers.get("authorization");
  const bearer = incomingAuth || bearerFromCookieHeader(incomingCookie);

  const fwdHeaders = new Headers();
  const accept = req.headers.get("accept");
  if (accept) fwdHeaders.set("accept", accept);
  if (incomingCookie) fwdHeaders.set("cookie", incomingCookie);
  if (bearer) fwdHeaders.set("authorization", bearer);

  const r = await fetch(upstream, {
    method: "GET",
    headers: fwdHeaders,
    signal: req.signal,
    cache: "no-store",
  });

  const out = new NextResponse(r.body, { status: r.status });
  out.headers.set("cache-control", "no-store");

  const ct = r.headers.get("content-type");
  if (ct) out.headers.set("content-type", ct);

  const setCookie = (r.headers as HeadersWithGetSetCookie).getSetCookie?.() ?? r.headers.get("set-cookie");
  if (Array.isArray(setCookie)) {
    setCookie.forEach((c) => out.headers.append("set-cookie", c));
  } else if (typeof setCookie === "string" && setCookie) {
    out.headers.set("set-cookie", setCookie);
  }

  return out;
}
