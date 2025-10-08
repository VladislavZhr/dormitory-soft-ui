// src/features/profile/ui/ProfileContainer.tsx
// TypeScript strict
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { useForm } from "react-hook-form";

import { changePassword } from "../api/client";
import { mapError } from "../lib/mapError";
import { changePasswordSchema } from "../model/schema";
import type { ChangePasswordErrors, ChangePasswordForm, ProfileViewProps } from "../model/types";

import ProfileView from "./ProfileView";

export default function ProfileContainer(): React.JSX.Element {
  // TODO: підставити реальні дані профілю (через /api/auth/me або з серверної сторінки)
  const name = "Admin User";

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const [success, setSuccess] = React.useState<string | null>(null);
  const [error, setErrorMsg] = React.useState<string | null>(null);

  // сервер може повертати ключі типу oldPassword/newPassword; мапимо у поля форми
  const mapServerFieldToForm = (k: string): keyof ChangePasswordForm | null => {
    if (k === "oldPassword") return "currentPassword";
    if (k === "newPassword") return "newPassword";
    if (k === "currentPassword" || k === "confirmPassword") return k;
    return null;
  };

  const onSubmit: ProfileViewProps["onSubmit"] = handleSubmit(async (values) => {
    setSuccess(null);
    setErrorMsg(null);

    try {
      await changePassword({
        // Варіант B: бек визначає користувача з токена → username не надсилаємо
        oldPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      setSuccess("Password updated successfully.");
      reset();
    } catch (e) {
      // 1) Якщо це наша нормалізована помилка з fieldErrors — розкладаємо в поля
      if (e && typeof e === "object" && "fieldErrors" in e) {
        const fe = (e as { fieldErrors?: Record<string, string> }).fieldErrors ?? {};
        for (const [key, message] of Object.entries(fe)) {
          const formKey = mapServerFieldToForm(key);
          if (formKey) setError(formKey, { type: "server", message });
        }
        if (Object.keys(fe).length > 0) return;
      }
      // 2) Інакше нормалізуємо через mapError (Zod/загальні помилки)
      const m = mapError(e);
      setErrorMsg(m.message ?? "Unexpected error");
    }
  });

  // RHF помилки → плаский словник (з урахуванням exactOptionalPropertyTypes)
  const uiErrors: ChangePasswordErrors = {
    currentPassword: errors.currentPassword?.message,
    newPassword: errors.newPassword?.message,
    confirmPassword: errors.confirmPassword?.message,
  };

  return <ProfileView name={name} register={register} errors={uiErrors} isSubmitting={isSubmitting} success={success} error={error} onSubmit={onSubmit} />;
}
