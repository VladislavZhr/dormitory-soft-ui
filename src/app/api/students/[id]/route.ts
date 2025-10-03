import { NextRequest, NextResponse } from "next/server";

const BACKEND = (process.env.BACKEND_URL || "").replace(/\/+$/, ""); // напр.: http://localhost:3001/api

function upstreamUrl(id: string) {
  if (!BACKEND) throw new Error("Env BACKEND_URL is not set");
  return `${BACKEND}/students/${encodeURIComponent(id)}`;
}

function pickForwardHeaders(req: NextRequest, withBody: boolean): Headers {
  const h = new Headers();
  const accept = req.headers.get("accept");
  if (accept) h.set("accept", accept);
  const auth = req.headers.get("authorization");
  if (auth) h.set("authorization", auth);
  const cookie = req.headers.get("cookie");
  if (cookie) h.set("cookie", cookie);
  if (withBody) h.set("content-type", "application/json");
  return h;
}

function passthroughHeaders(from: Response): Headers {
  const out = new Headers();
  const ct = from.headers.get("content-type");
  if (ct) out.set("content-type", ct);
  from.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") out.append("set-cookie", value);
  });
  return out;
}

// УВАГА: у Next 15 контекст має params як Promise<{ id: string }>
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const r = await fetch(upstreamUrl(id), {
    method: "GET",
    headers: pickForwardHeaders(req, false),
    signal: req.signal,
    cache: "no-store",
  });

  const body = await r.text();
  return new NextResponse(body, { status: r.status, headers: passthroughHeaders(r) });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const bodyIn = await req.text();

  const r = await fetch(upstreamUrl(id), {
    method: "PATCH",
    headers: pickForwardHeaders(req, true),
    body: bodyIn,
    signal: req.signal,
    cache: "no-store",
  });

  const body = await r.text();
  return new NextResponse(body, { status: r.status, headers: passthroughHeaders(r) });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const r = await fetch(upstreamUrl(id), {
    method: "DELETE",
    headers: pickForwardHeaders(req, false),
    signal: req.signal,
    cache: "no-store",
  });

  const body = await r.text();
  return new NextResponse(body, { status: r.status, headers: passthroughHeaders(r) });
}
