// src/app/api/inventory/export/assigned.xlsx/route.ts
// TypeScript strict
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse, type NextRequest } from "next/server";

type HeadersWithGetSetCookie = Headers & { getSetCookie?: () => string[] | undefined };

const API = (process.env.BACKEND_API_URL || "").replace(/\/+$/u, "");

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
 * GET /api/inventory/export/assigned.xlsx
 * Проксі: тягнемо файл з бекенда і віддаємо як є (стрімом).
 */
export async function GET(req: NextRequest) {
  if (!API) {
    return NextResponse.json({ message: "BACKEND_API_URL is not set" }, { status: 500 });
  }

  const { search } = new URL(req.url);
  const target = `${API}/api/inventory/export/assigned.xlsx${search || ""}`;

  const incomingCookie = req.headers.get("cookie");
  const incomingAuth = req.headers.get("authorization");
  const bearer = incomingAuth || bearerFromCookieHeader(incomingCookie);

  const headers = new Headers();
  headers.set("accept", "*/*");
  if (incomingCookie) headers.set("cookie", incomingCookie);
  if (bearer) headers.set("authorization", bearer);

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: "GET",
      headers,
      cache: "no-store",
      redirect: "manual",
      signal: req.signal,
    });
  } catch (e) {
    return NextResponse.json({ message: "Upstream fetch failed", detail: String(e) }, { status: 502 });
  }

  const passCommon = (res: Response) => {
    const outHeaders = new Headers();
    const ct = res.headers.get("content-type");
    if (ct) outHeaders.set("content-type", ct);
    outHeaders.set("cache-control", "no-store");
    const setCookies = (res.headers as HeadersWithGetSetCookie).getSetCookie?.() ?? (res.headers.get("set-cookie") ? [res.headers.get("set-cookie") as string] : []);
    for (const sc of setCookies) {
      if (sc) outHeaders.append("set-cookie", sc);
    }
    return outHeaders;
  };

  if (!upstream.ok) {
    const errHeaders = passCommon(upstream);
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: errHeaders,
    });
  }

  const outHeaders = passCommon(upstream);
  const copyHeader = (name: string) => {
    const v = upstream.headers.get(name);
    if (v) outHeaders.set(name, v);
  };
  copyHeader("content-length");
  copyHeader("content-disposition");
  copyHeader("etag");
  copyHeader("last-modified");

  outHeaders.set("access-control-expose-headers", "Content-Disposition, Content-Type, Content-Length, ETag, Last-Modified");

  return new NextResponse(upstream.body, {
    status: 200,
    headers: outHeaders,
  });
}
