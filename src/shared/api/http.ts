const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "https://9430813741ef.ngrok-free.app").replace(/\/+$/, "");

type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

async function request<T>(path: string, init: RequestInit, expected: number[] = [200]): Promise<T> {
  const url = `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? ((await res.json().catch(() => ({}))) as unknown) : await res.text();

  if (!expected.includes(res.status)) {
    const message = (isJson && (data as { message?: string })?.message) || `HTTP ${res.status}`;
    const err = new Error(message) as Error & { status?: number; payload?: unknown };
    err.status = res.status;
    err.payload = data;
    throw err;
  }

  return data as T;
}

export const http = {
  get<T>(path: string, init?: RequestInit) {
    return request<T>(path, { method: "GET", ...(init || {}) }, [200]);
  },
  post<TReq extends Json, TRes>(path: string, body: TReq, init?: RequestInit) {
    return request<TRes>(path, { method: "POST", body: JSON.stringify(body), ...(init || {}) }, [200, 201]);
  },
  put<TReq extends Json, TRes>(path: string, body: TReq, init?: RequestInit) {
    return request<TRes>(path, { method: "PUT", body: JSON.stringify(body), ...(init || {}) }, [200]);
  },
  delete<TRes>(path: string, init?: RequestInit) {
    return request<TRes>(path, { method: "DELETE", ...(init || {}) }, [200, 204]);
  },
};
