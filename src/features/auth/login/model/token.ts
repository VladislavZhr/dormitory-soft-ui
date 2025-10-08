export function parseJwtUntrusted(token: string | undefined): Record<string, unknown> | null {
  try {
    if (!token) return null;

    const parts = token.split(".");
    if (parts.length < 2) return null;

    const base64: string = parts[1] ?? "";
    if (!base64) return null;

    // ✅ Явно вказуємо, що base64 — це string, і гарантуємо тип
    const decoded = Buffer.from(base64 as string, "base64").toString("utf8");
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function displayNameFromJwt(token: string | undefined): string {
  const payload = parseJwtUntrusted(token);
  return payload && typeof payload["sub"] === "string" ? (payload["sub"] as string) : "Anonymous";
}
