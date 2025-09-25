// src/shared/api/http.ts

export class HttpError extends Error {
  status: number;
  body?: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

// Базовий JSON fetch до нашого Next API (локальні /api/* маршрути)
export async function httpJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });

  const text = await res.text();
  const contentType = res.headers.get('content-type') || '';
  const maybeJson = contentType.includes('application/json');

  if (!res.ok) {
    let body: unknown = text;
    try {
      if (maybeJson) body = JSON.parse(text);
    } catch {
      //
    }
    throw new HttpError(res.status, `HTTP ${res.status}`, body);
  }

  if (!text) return undefined as T;
  return (maybeJson ? JSON.parse(text) : (text as unknown)) as T;
}
