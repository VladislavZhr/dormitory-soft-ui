import { NextRequest, NextResponse } from 'next/server';
const BACKEND = (process.env.BACKEND_URL || '').replace(/\/+$/, '');

export async function POST(req: NextRequest) {
  if (!BACKEND) throw new Error('Env BACKEND_URL is not set');
  const upstream = `${BACKEND}/inventory/return`;
  const bodyIn = await req.text();

  const r = await fetch(upstream, {
    method: 'POST',
    headers: new Headers({
      'content-type': 'application/json',
      ...(req.headers.get('authorization')
        ? { authorization: req.headers.get('authorization')! }
        : {}),
      ...(req.headers.get('cookie') ? { cookie: req.headers.get('cookie')! } : {}),
    }),
    body: bodyIn,
    signal: req.signal,
    cache: 'no-store',
  });

  const body = await r.text();
  const out = new NextResponse(body, { status: r.status });
  const setCookie = r.headers.get('set-cookie');
  if (setCookie) out.headers.set('set-cookie', setCookie);
  out.headers.set('content-type', r.headers.get('content-type') || 'application/json');
  return out;
}
