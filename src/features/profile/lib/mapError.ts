// TypeScript strict
import { ZodError } from "zod";

type FieldErrors = Record<string, string>;

export function mapError(err: unknown): {
  message?: string;
  fieldErrors?: FieldErrors;
} {
  if (err instanceof ZodError) {
    const fieldErrors: FieldErrors = {};
    for (const issue of err.issues) {
      const key = issue.path.join(".") || "_";
      if (!(key in fieldErrors)) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const message = err instanceof Error ? err.message : "Unknown error occurred";
  return { message };
}
