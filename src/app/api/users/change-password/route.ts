// src/app/api/users/change-password/route.ts
// TypeScript strict
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { ACCESS_TOKEN_KEY } from "@/shared/config/constants";

/** Акуратно додаємо `/api`, якщо його немає в BACKEND_API_URL */
function joinApi(base: string, pathname: string): string {
  const trimmed = base.replace(/\/+$/, "");
  const needsApi = !/\/api(?:$|\/)/.test(trimmed);
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${trimmed}${needsApi ? "/api" : ""}${path}`;
}

// ===== Zod-схеми ============================================================

/** Тіло від клієнта (username НЕ приймаємо — підставляємо з токена) */
const clientBodySchema = z.object({
  oldPassword: z.string().min(1, "Old password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});
type ClientBody = z.infer<typeof clientBodySchema>;

/** Можлива форма помилки від бекенда */
const backendErrorSchema = z.object({
  message: z.string().optional(),
  fieldErrors: z.record(z.string(), z.string()).optional(),
});
type BackendError = z.infer<typeof backendErrorSchema>;

// ===== JWT helpers ==========================================================

function b64urlDecode(input: string): string {
  const padLen = (4 - (input.length % 4)) % 4;
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(padLen);
  return Buffer.from(base64, "base64").toString("utf-8");
}

function extractUsernameFromJwt(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payloadStr = b64urlDecode(parts[1]!);
    const payload = JSON.parse(payloadStr) as Record<string, unknown>;

    const candidate =
      (payload["preferred_username"] as string | undefined) ??
      (payload["username"] as string | undefined) ??
      (payload["sub"] as string | undefined) ??
      (typeof payload["email"] === "string" && payload["email"].includes("@") ? (payload["email"] as string).split("@")[0]! : undefined);

    return typeof candidate === "string" && candidate.trim() ? candidate.trim() : null;
  } catch {
    return null;
  }
}

// ===== Handler ==============================================================

export async function POST(req: NextRequest) {
  try {
    const BACKEND = (process.env.BACKEND_API_URL || "").replace(/\/+$/, "");
    if (!BACKEND) {
      // Раніше тут був throw на рівні модуля → 500. Тепер повертаємо контрольований 500.
      return NextResponse.json({ message: "BACKEND_API_URL не налаштовано" }, { status: 500 });
    }
    const cookieStore = await cookies();
    const token = cookieStore.get(ACCESS_TOKEN_KEY)?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ fieldErrors: { _root: "Некоректний JSON у запиті" } }, { status: 400 });
    }

    const parsed = clientBodySchema.safeParse(json);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path.join(".") || "_root";
        if (!fieldErrors[path]) fieldErrors[path] = issue.message;
      }
      return NextResponse.json({ fieldErrors }, { status: 400 });
    }
    const body: ClientBody = parsed.data;

    const username = extractUsernameFromJwt(token);
    if (!username) {
      return NextResponse.json({ fieldErrors: { username: "Не вдалося визначити користувача з токена" } }, { status: 400 });
    }

    const url = joinApi(BACKEND, "/users/change-password");

    const res = await fetch(url, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        Authorization: `Bearer ${token}`, // якщо бек вимагає
      },
      body: JSON.stringify({
        username,
        oldPassword: body.oldPassword,
        newPassword: body.newPassword,
      }),
      cache: "no-store",
      signal: req.signal,
      redirect: "manual",
    });

    const text = await res.text();
    const data: unknown = text ? JSON.parse(text) : null;

    if (!res.ok) {
      const parsedErr = backendErrorSchema.safeParse(data);
      if (parsedErr.success && parsedErr.data.fieldErrors) {
        return NextResponse.json(parsedErr.data as BackendError, { status: res.status });
      }
      const message = parsedErr.success ? parsedErr.data.message : undefined;
      return NextResponse.json({ fieldErrors: { _root: message ?? res.statusText } }, { status: res.status });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    // Глобальна «сітка безпеки», щоб не падати 500 без тіла
    if (process.env.NODE_ENV !== "production") {
      console.error("[change-password] unhandled error:", e);
    }
    return NextResponse.json({ fieldErrors: { _root: "Серверна помилка або недоступний бекенд" } }, { status: 502 });
  }
}
