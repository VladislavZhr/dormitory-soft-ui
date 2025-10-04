// TypeScript strict
import { changePasswordApiReqSchema, type ChangePasswordApiReq } from "@/features/profile/model/schema";
import { httpJson, HttpError } from "@/shared/api/http";

export type ApiError = Error & {
  status?: number;
  fieldErrors?: Record<string, string> | undefined;
};

/**
 * Клієнтська mutationFn для TanStack Query.
 * Валідація Zod тут, до звернення в /api/users/change-password.
 * Потік: UI → (validate) → httpJson('/api/users/change-password') → route.ts → зовнішній бекенд.
 */
export async function changePassword(payload: ChangePasswordApiReq): Promise<void> {
  // 1) Zod-валідація на клієнті
  const parsed = changePasswordApiReqSchema.safeParse(payload);
  if (!parsed.success) {
    // Збираємо { [field]: message } під mapError
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".") || "_root";
      if (!fieldErrors[path]) fieldErrors[path] = issue.message;
    }
    const apiErr: ApiError = new Error("Помилка валідації");
    apiErr.status = 400;
    apiErr.fieldErrors = fieldErrors;
    throw apiErr;
  }

  // 2) Внутрішній бекенд (Next API)
  try {
    await httpJson<unknown>("/api/users/change-password", {
      method: "POST",
      body: JSON.stringify(parsed.data),
    });
    return;
  } catch (e: unknown) {
    // 3) Нормалізація помилок під mapError
    if (e instanceof HttpError) {
      const apiErr: ApiError = new Error(e.message);
      apiErr.status = e.status;

      const body = e.body;
      if (body && typeof body === "object") {
        // Якщо бек віддає fieldErrors — прокидуємо їх
        if ("fieldErrors" in body) {
          apiErr.fieldErrors = (body as { fieldErrors?: Record<string, string> }).fieldErrors;
        }
        // Якщо є message — збережемо більш конкретне повідомлення
        if ("message" in body && typeof (body as { message?: unknown }).message === "string") {
          apiErr.message = (body as { message: string }).message;
        }
      }
      throw apiErr;
    }

    const apiErr: ApiError = new Error("Мережна помилка. Перевірте з'єднання.");
    apiErr.status = 0;
    throw apiErr;
  }
}
