// TypeScript strict
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

import { auditCreateSchema } from "@/features/audit/model/schema";

// Зовнішній бекенд
const BACKEND = (process.env.BACKEND_API_URL || "").replace(/\/+$/, "");
type HeadersWithGetSetCookie = Headers & {
  getSetCookie?: () => string[];
};
// Загальні хелпери
function pickAuthHeaders(req: NextRequest) {
  const h = new Headers();
  const auth = req.headers.get("authorization");
  if (auth) h.set("authorization", auth);
  const cookie = req.headers.get("cookie");
  if (cookie) h.set("cookie", cookie);
  return h;
}

function exposeCommon(out: NextResponse) {
  out.headers.set("access-control-expose-headers", "Content-Type, Content-Length, ETag, Last-Modified, Set-Cookie");
  out.headers.set("cache-control", "no-store");
  return out;
}

function forwardSetCookies(upstream: Response, out: NextResponse) {
  // Підтримка кількох Set-Cookie
  const getSetCookie = (upstream.headers as HeadersWithGetSetCookie).getSetCookie?.bind(upstream.headers);
  if (typeof getSetCookie === "function") {
    for (const c of getSetCookie()) out.headers.append("set-cookie", c);
  } else {
    const one = upstream.headers.get("set-cookie");
    if (one) out.headers.append("set-cookie", one);
  }
}

/**
 * GET /api/inventories/audits  →  {BACKEND}/inventories/audits
 */
export async function GET(req: NextRequest) {
  if (!BACKEND) {
    return NextResponse.json({ message: "Env BACKEND_API_URL is not set" }, { status: 500 });
  }

  // Проксі query string як є
  const { search } = new URL(req.url);
  const upstreamUrl = `${BACKEND}/inventories/audits${search || ""}`;

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

/**
 * POST /api/inventories/audits  →  {BACKEND}/inventories/audits
 * Валідація payload на вході (Zod) перед проксі.
 */
export async function POST(req: NextRequest) {
  if (!BACKEND) {
    return NextResponse.json({ message: "Env BACKEND_API_URL is not set" }, { status: 500 });
  }

  // 1) Зчитуємо та валідуємо payload локально
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON", fieldErrors: { _root: "Тіло запиту має бути JSON" } }, { status: 400 });
  }

  const parsed = auditCreateSchema.safeParse(payload);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".") || "_root";
      if (!fieldErrors[path]) fieldErrors[path] = issue.message;
    }
    return NextResponse.json({ message: "Помилка валідації", fieldErrors }, { status: 400 });
  }

  // 2) Проксі валідованих даних у бекенд
  const headers = pickAuthHeaders(req);
  headers.set("content-type", "application/json");
  headers.set("accept", "application/json");

  let r: Response;
  try {
    r = await fetch(`${BACKEND}/inventories/audits`, {
      method: "POST",
      headers,
      body: JSON.stringify(parsed.data),
      cache: "no-store",
      signal: req.signal,
      redirect: "manual",
    });
  } catch (e) {
    return NextResponse.json({ message: "Upstream fetch failed", detail: String(e) }, { status: 502 });
  }

  // Віддаємо тіло/статус як є
  const out = new NextResponse(r.body, {
    status: r.status,
    headers: {
      "content-type": r.headers.get("content-type") || "application/json; charset=utf-8",
    },
  });

  forwardSetCookies(r, out);
  return exposeCommon(out);
}
