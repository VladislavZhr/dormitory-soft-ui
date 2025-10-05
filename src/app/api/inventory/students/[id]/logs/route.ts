// src/app/api/inventory/students/[id]/logs/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND = (process.env.BACKEND_URL || '').replace(/\/+$/, '');

type Ctx = { params: Promise<{ id: string }> };
type HeadersWithGetSetCookie = Headers & { getSetCookie?: () => string[] };

export async function GET(req: NextRequest, ctx: Ctx): Promise<Response> {
  if (!BACKEND) {
    return NextResponse.json({ error: 'Env BACKEND_URL is not set' }, { status: 500 });
  }

  const { id } = await ctx.params; // ✅ у Next 15 params — Promise
  const idStr = String(id ?? '').trim();
  if (!idStr) {
    return NextResponse.json({ error: 'Missing route param: id' }, { status: 400 });
  }

  const upstream = `${BACKEND}/inventory/students/${encodeURIComponent(idStr)}/logs`;

  // Проксіруємо корисні заголовки (authorization, cookie)
  const fwdHeaders = new Headers();
  const auth = req.headers.get('authorization');
  const cookie = req.headers.get('cookie');
  if (auth) fwdHeaders.set('authorization', auth);
  if (cookie) fwdHeaders.set('cookie', cookie);

  const r = await fetch(upstream, {
    method: 'GET',
    headers: fwdHeaders,
    signal: req.signal,
    cache: 'no-store',
    // next: { revalidate: 0 } // (за бажанням) явний no-revalidate
  });

  // Стрімимо тіло без буферизації
  const out = new NextResponse(r.body, { status: r.status });

  // Проксіруємо content-type (щоб таблиці/JSON віддавалися правильно)
  const ct = r.headers.get('content-type');
  out.headers.set('content-type', ct ?? 'application/json');

  // Коректна передача Set-Cookie (може бути кілька)
  const setCookieValues =
    (r.headers as HeadersWithGetSetCookie).getSetCookie?.() ??
    (r.headers.get('set-cookie') ? [r.headers.get('set-cookie') as string] : []);

  for (const c of setCookieValues) {
    if (c) out.headers.append('set-cookie', c);
  }

  return out;
}
