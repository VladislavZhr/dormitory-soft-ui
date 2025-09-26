/* eslint-disable @typescript-eslint/no-unused-vars */
import type { LoginReq } from "../model/types";

export type ApiError = Error & {
  status?: number;
  fieldErrors?: Record<string, string>;
};

/**
 * Клієнтська mutationFn для TanStack Query.
 * Важливо: звертаємось до ВНУТРІШНЬОГО Next API (/api/auth/login).
 * HttpOnly cookie виставляється на сервері в route handler.
 */
export async function login(payload: LoginReq): Promise<void> {
  let res: Response;

  try {
    res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch (networkErr) {
    const err: ApiError = new Error("Мережна помилка. Перевірте з’єднання.");
    err.status = 0;
    throw err;
  }

  if (res.ok) return;

  let data: unknown = null;
  const contentType = res.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) {
      data = await res.json();
    } else {
      const text = await res.text();
      data = text ? { message: text } : null;
    }
  } catch {
    // ignore parse errors
  }

  const err: ApiError = new Error((isRecord(data) && typeof data.message === "string" && data.message) || res.statusText || `HTTP ${res.status}`);
  err.status = res.status;

  if (isRecord(data) && isRecord(data.fieldErrors)) {
    err.fieldErrors = data.fieldErrors as Record<string, string>;
  }

  throw err;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
