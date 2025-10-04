import { NextRequest, NextResponse } from "next/server";

const BACKEND = (process.env.BACKEND_URL || "").replace(/\/+$/, "");

function upstreamUrl(studentId: string) {
  if (!BACKEND) throw new Error("Env BACKEND_URL is not set");
  return `${BACKEND}/inventory/students/${encodeURIComponent(studentId)}/items`;
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

// GET /api/inventory/students/[id]/items
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
