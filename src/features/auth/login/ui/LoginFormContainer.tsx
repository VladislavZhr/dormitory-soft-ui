"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useController } from "react-hook-form";

import { login } from "@/features/auth/login/api/client";
import { mapError } from "@/features/auth/login/lib/mapError";
import { loginSchema, type LoginFormValues } from "@/features/auth/login/model/schema";

import LoginFormView from "./LoginFormView";

export default function LoginFormContainer() {
  const router = useRouter();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: { username: "", password: "" },
  });

  // Робимо поля контрольованими, щоб View було повністю «німим» до RHF
  const usernameCtl = useController({ control, name: "username" });
  const passwordCtl = useController({ control, name: "password" });

  // _root помилка (не прив’язана до поля)
  const [rootError, setRootError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: login, // POST /api/auth/login
    onSuccess: () => {
      router.replace("/");
    },
    onError: (err: unknown) => {
      const fe = mapError(err);
      if (fe._root) setRootError(fe._root);
      Object.entries(fe).forEach(([field, message]) => {
        if (field === "_root") return;
        setError(field as keyof LoginFormValues, { type: "server", message });
      });
    },
  });

  const onSubmit = handleSubmit((values) => {
    setRootError(null);
    mutation.mutate(values);
  });

  return (
    <LoginFormView
      // значення/зміни
      username={usernameCtl.field.value ?? ""}
      onUsernameChange={usernameCtl.field.onChange}
      password={passwordCtl.field.value ?? ""}
      onPasswordChange={passwordCtl.field.onChange}
      // помилки
      usernameError={errors.username?.message ?? null}
      passwordError={errors.password?.message ?? null}
      rootError={rootError}
      // стани та сабміт
      loading={mutation.isPending}
      onSubmit={onSubmit}
    />
  );
}
