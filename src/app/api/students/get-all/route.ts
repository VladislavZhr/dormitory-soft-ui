// TypeScript strict
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";

/**
 * GET /api/students/get-all
 * Проксі на: GET {BACKEND_API_URL}/students/get-all?...
 * Без валідації та моків.
 */
export async function GET(req: NextRequest) {
  const API = (process.env.BACKEND_API_URL || "").replace(/\/+$/, "");
  if (!API) {
    return NextResponse.json({ message: "BACKEND_API_URL is not set" }, { status: 500 });
  }

  const { search } = new URL(req.url);
  const target = `${API}/api/students/get-all${search}`;

  try {
    const upstream = await fetch(target, {
      method: "GET",
      headers: {
        accept: "application/json",
        cookie: req.headers.get("cookie") ?? "",
      },
      cache: "no-store",
      signal: req.signal,
    });

    const contentType = upstream.headers.get("content-type") || "";
    const text = await upstream.text();
    const body = contentType.includes("application/json") ? safeJson(text) : text;

    return NextResponse.json(body, {
      status: upstream.status,
      headers: { "cache-control": "no-store" },
    });
  } catch {
    return NextResponse.json({ message: "Upstream fetch failed" }, { status: 502 });
  }
}

function safeJson(s: string): unknown {
  try {
    return s ? JSON.parse(s) : null;
  } catch {
    return {};
  }
}
