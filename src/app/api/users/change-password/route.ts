// TypeScript strict
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

const BACKEND = (process.env.BACKEND_API_URL || "").replace(/\/+$/, "");
if (!BACKEND) throw new Error("Env BACKEND_API_URL is not set");

/** Акуратно додаємо `/api`, якщо його немає в BACKEND_API_URL */
function joinApi(pathname: string): string {
  const base = BACKEND.replace(/\/+$/, "");
  const needsApi = !/\/api(?:$|\/)/.test(base);
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${base}${needsApi ? "/api" : ""}${path}`;
}

function pickForwardHeaders(req: NextRequest, withBody: boolean): Headers {
  const h = new Headers();
  const accept = req.headers.get("accept");
  if (accept) h.set("accept", accept);
  const auth = req.headers.get("authorization");
  if (auth) h.set("authorization", auth);
  const cookie = req.headers.get("cookie");
  if (cookie) h.set("cookie", cookie);
  if (withBody) {
    const ct = req.headers.get("content-type");
    if (ct) h.set("content-type", ct);
  }
  return h;
}

function passthroughHeaders(from: Response): Headers {
  const out = new Headers();
  const ct = from.headers.get("content-type");
  if (ct) out.set("content-type", ct);
  from.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") out.append("set-cookie", value);
  });
  const loc = from.headers.get("location");
  if (loc) out.set("location", loc);
  return out;
}

export async function POST(req: NextRequest) {
  const url = joinApi("/users/change-password");

  const bodyIn = await req.text(); // стрімимо як є

  const r = await fetch(url, {
    method: "POST",
    headers: pickForwardHeaders(req, true),
    body: bodyIn,
    signal: req.signal,
    cache: "no-store",
    redirect: "manual",
  });

  const body = await r.text();
  return new NextResponse(body, { status: r.status, headers: passthroughHeaders(r) });
}
