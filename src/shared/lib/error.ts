// src/shared/lib/error.ts
import { HttpError } from "@/shared/api/http";

export function isHttpError(e: unknown): e is HttpError {
  return e instanceof HttpError;
}

// вузький guard: будь-який не-null object
function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

/** Дістає message з HttpError.body → Error → plain object → string */
export function extractErrorMessage(e: unknown, fallback: string | null = null): string | null {
  if (isHttpError(e)) {
    const msg = e.body?.message ?? e.message;
    return typeof msg === "string" ? msg : fallback;
  }

  if (e instanceof Error && typeof e.message === "string") {
    return e.message;
  }

  if (isRecord(e) && typeof e["message"] === "string") {
    return e["message"] as string;
  }

  if (typeof e === "string") {
    return e;
  }

  return fallback;
}
