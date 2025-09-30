// src/app/api/inventory/issue/route.ts
import type { NextRequest } from "next/server";

export async function POST(_req: NextRequest) {
  return new Response(JSON.stringify({ message: "Not implemented" }), {
    status: 501,
    headers: { "content-type": "application/json" },
  });
}
