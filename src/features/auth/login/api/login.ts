import type { LoginReq } from "../model/types";

export type ApiError = Error & {
  status?: number;
  fieldErrors?: Record<string, string>;
};

export async function login(payload: LoginReq): Promise<void> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (res.ok) return;

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // якщо не JSON — залишимо data = null
  }

  const err: ApiError = new Error((data as { message?: string })?.message ?? `HTTP ${res.status}`);
  err.status = res.status;

  if (isRecord(data) && isRecord(data.fieldErrors)) {
    err.fieldErrors = data.fieldErrors as Record<string, string>;
  }

  throw err;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
