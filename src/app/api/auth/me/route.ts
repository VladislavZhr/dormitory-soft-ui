// TypeScript strict
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse, type NextRequest } from "next/server";

import { ACCESS_TOKEN_KEY } from "@/features/auth/login/model/constants";
import { parseJwtUntrusted } from "@/features/auth/login/model/token";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(ACCESS_TOKEN_KEY)?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: { "cache-control": "no-store" } });
  }

  const payload = parseJwtUntrusted(token);
  const name = payload && typeof payload["sub"] === "string" ? (payload["sub"] as string) : "Anonymous";

  if (!name) {
    return NextResponse.json({ message: "Name not present in token" }, { status: 422, headers: { "cache-control": "no-store" } });
  }

  return NextResponse.json({ name }, { headers: { "cache-control": "no-store" } });
}
