// src/shared/api/http.ts

export interface ApiErrorBody {
  message?: string;
  errorCode?: string | number;
  [k: string]: unknown;
}

export class HttpError extends Error {
  name = 'HttpError';
  status: number;
  // з exactOptionalPropertyTypes не можна опускати undefined-assign; робимо явний union
  body: ApiErrorBody | undefined;

  constructor(status: number, message: string, body?: ApiErrorBody) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

function toAbsoluteOnServer(input: RequestInfo | URL): RequestInfo | URL {
  if (typeof window !== 'undefined') return input; // у браузері лишаємо як є

  // ВАЖЛИВО: використовуємо || (а не ??), і робимо фінальну підстраховку
  let origin =
    process.env.APP_ORIGIN ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  if (!origin) origin = 'http://localhost:3000';

  if (typeof input === 'string') {
    if (input.startsWith('http://') || input.startsWith('https://')) return input;
    return new URL(input, origin).toString();
  }
  if (input instanceof URL) return input;
  return input;
}

export async function httpJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const resolved = toAbsoluteOnServer(input); // ⬅ додано

  const res = await fetch(resolved, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
    credentials: init?.credentials ?? 'include',
  });

  const text = await res.text();
  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  // спробувати розпарсити JSON навіть для помилок
  let parsed: unknown = null;
  if (text) {
    if (isJson) {
      try {
        parsed = JSON.parse(text);
      } catch {
        /* ignore */
      }
    } else {
      parsed = text;
    }
  }

  if (!res.ok) {
    const body: ApiErrorBody | undefined =
      parsed && typeof parsed === 'object' ? (parsed as ApiErrorBody) : undefined;

    const msgFromBody = body && typeof body.message === 'string' ? body.message : undefined;

    throw new HttpError(res.status, msgFromBody ?? res.statusText ?? `HTTP ${res.status}`, body);
  }

  if (!text) return undefined as T;
  return (isJson ? JSON.parse(text) : (text as unknown)) as T;
}
