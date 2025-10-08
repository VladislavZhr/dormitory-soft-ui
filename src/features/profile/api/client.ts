// src/features/profile/api/client.ts
// TypeScript strict

import { changePasswordApiReqSchema, type ChangePasswordApiReq } from "@/features/profile/model/schema";
import { httpJson, HttpError } from "@/shared/api/http";

export type ApiError = Error & {
  status?: number;
  fieldErrors?: Record<string, string> | undefined;
};

/**
 * Клієнтська mutationFn для TanStack Query.
 * Потік: UI → (validate Zod) → /api/users/change-password → зовнішній бекенд (проксі на сервері).
 * Токен у HttpOnly-cookie, у клієнті ми його не читаємо і не прокидаємо.
 */
export async function changePassword(payload: ChangePasswordApiReq): Promise<void> {
  // 1) Локальна Zod-валідація API DTO
  const parsed = changePasswordApiReqSchema.safeParse(payload);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".") || "_root";
      fieldErrors[path] = fieldErrors[path] ?? issue.message;
    }
    const apiErr: ApiError = new Error("Помилка валідації");
    apiErr.status = 400;
    apiErr.fieldErrors = fieldErrors;
    throw apiErr;
  }

  // 2) Внутрішній бекенд (Next API). httpJson має credentials:'include' → кука їде автоматично.
  try {
    await httpJson<never>("/api/users/change-password", {
      method: "POST",
      body: JSON.stringify(parsed.data),
    });
    return;
  } catch (e: unknown) {
    // 3) Нормалізація помилок під mapError
    if (e instanceof HttpError) {
      const apiErr: ApiError = new Error(e.message || "Помилка запиту");
      apiErr.status = e.status;

      const body = e.body;
      if (body && typeof body === "object") {
        const b = body as { fieldErrors?: Record<string, string>; message?: unknown };
        if (b.fieldErrors) apiErr.fieldErrors = b.fieldErrors;
        if (typeof b.message === "string" && b.message) apiErr.message = b.message;
      }
      throw apiErr;
    }

    const apiErr: ApiError = new Error("Мережна помилка. Перевірте з'єднання.");
    apiErr.status = 0;
    throw apiErr;
  }
}
