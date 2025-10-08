import { ZodError } from "zod";

export type FieldErrors = Record<string, string>;

/**
 * Нормалізуємо помилки у { [field]: message } для показу у формі.
 */
export function mapError(err: unknown): FieldErrors {
  // 1) Zod
  if (err instanceof ZodError) {
    const out: FieldErrors = {};
    for (const e of err.issues) {
      const path = e.path.join(".") || "_root";
      // перша помилка важливіша за наступні
      if (!out[path]) out[path] = e.message;
    }
    return out;
  }

  // 2) Наші API-помилки з поля fieldErrors
  if (isRecord(err) && isRecord(err.fieldErrors)) {
    return err.fieldErrors as FieldErrors;
  }

  // 3) fetch/HTTP помилки
  if (isRecord(err) && typeof err.message === "string") {
    return { _root: err.message };
  }

  return { _root: "Сталася помилка. Спробуйте ще раз." };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
