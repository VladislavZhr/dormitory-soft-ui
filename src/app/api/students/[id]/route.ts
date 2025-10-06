// src/app/api/students/[id]/route.ts
// TypeScript strict
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

/**
 * Ім'я cookie з токеном. Якщо у вас є спільний constants-файл —
 * можете замінити на імпорт. Тут робимо без залежностей.
 */
const ACCESS_TOKEN_KEY = "access_token";

const BACKEND = (process.env.BACKEND_URL || "").replace(/\/+$/, ""); // напр.: http://localhost:3001/api

function upstreamUrl(id: string) {
  if (!BACKEND) throw new Error("Env BACKEND_URL is not set");
  return `${BACKEND}/students/${encodeURIComponent(id)}`;
}

/** Примітивний парсер cookies з заголовка Cookie */
function getCookieFromHeader(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  // Розбиваємо на пари key=value; пробіли прибираємо
  const parts = cookieHeader.split(";");
  for (const p of parts) {
    const [k, ...rest] = p.trim().split("=");
    if (!k) continue;
    if (k === name) return rest.join("=");
  }
  return undefined;
}

/** Готуємо Authorization з пріоритетом: вхідний header → cookie */
function resolveAuth(req: NextRequest): string | undefined {
  const incoming = req.headers.get("authorization");
  if (incoming && /^bearer\s+/i.test(incoming)) return incoming;

  const cookieHeader = req.headers.get("cookie");
  const token = getCookieFromHeader(cookieHeader, ACCESS_TOKEN_KEY);
  return token ? `Bearer ${token}` : undefined;
}

/** Формуємо заголовки для апстріма */
function pickForwardHeaders(req: NextRequest, withBody: boolean): Headers {
  const h = new Headers();

  const accept = req.headers.get("accept");
  if (accept) h.set("accept", accept);

  // Authorization: беремо з resolveAuth()
  const auth = resolveAuth(req);
  if (auth) h.set("authorization", auth);

  // Прокинемо cookie як є (якщо бек орієнтується на сесійні куки)
  const cookie = req.headers.get("cookie");
  if (cookie) h.set("cookie", cookie);

  if (withBody) h.set("content-type", "application/json");

  // Не кешуємо приватні відповіді
  h.set("cache-control", "no-store");

  return h;
}

/** Пропускаємо тип та Set-Cookie з апстріма */
function passthroughHeaders(from: Response): Headers {
  const out = new Headers();

  const ct = from.headers.get("content-type");
  if (ct) out.set("content-type", ct);

  from.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") out.append("set-cookie", value);
  });

  out.set("cache-control", "no-store");
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
