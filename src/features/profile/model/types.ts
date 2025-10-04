// TypeScript strict
import type { UseFormRegister } from "react-hook-form";

export type ChangePasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

/**
 * Враховано exactOptionalPropertyTypes: значення можуть бути undefined.
 */
export type ChangePasswordErrors = Partial<Record<keyof ChangePasswordForm, string | undefined>>;

export type ProfileViewProps = {
  name: string;
  email: string;
  /** RHF реєстрація — обовʼязкова, бо у View викликаємо register('field') */
  register: UseFormRegister<ChangePasswordForm>;
  errors: ChangePasswordErrors;
  isSubmitting?: boolean;
  success?: string | null;
  error?: string | null;
  /** submit з RHF (handleSubmit(...)) */
  onSubmit: (e?: React.BaseSyntheticEvent) => void;
};
