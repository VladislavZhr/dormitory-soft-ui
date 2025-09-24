// src/features/auth/login/ui/LoginForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { login } from "@/features/auth/login/api/login";
import { mapError } from "@/features/auth/login/lib/mapError";

import { loginSchema, type LoginFormValues } from "../model/schema";

import Alert from "./Alert";
import PasswordInput from "./PasswordInput";
import SubmitButton from "./SubmitButton";

export default function LoginForm() {
  const router = useRouter();

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: { username: "", password: "" },
  });

  const [rootError, setRootError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      router.replace("/dashboard");
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

  const onSubmit = (values: LoginFormValues) => {
    setRootError(null);
    mutation.mutate(values);
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur-xl">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-xl bg-blue-400/15 ring-1 ring-blue-200/50">
          <span className="text-xl">🏠</span>
        </div>
        <h1 className="text-lg font-semibold text-slate-900">Панель гуртожитку</h1>
        <p className="text-sm text-slate-600">Увійдіть до системи</p>
      </div>

      {rootError ? <Alert type="error">{rootError}</Alert> : null}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Username */}
        <div>
          <label htmlFor="username" className="mb-1 block text-sm font-medium text-slate-700">
            Логін
          </label>
          <input
            id="username"
            autoComplete="username"
            placeholder="admin"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            {...register("username")}
          />
          {errors.username ? <p className="mt-1 text-xs text-rose-600">{errors.username.message}</p> : null}
        </div>

        {/* Password */}
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <>
              <PasswordInput value={field.value} onChange={field.onChange} placeholder="qwerty123" />
              {errors.password ? <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p> : null}
            </>
          )}
        />

        <SubmitButton loading={mutation.isPending}>Увійти</SubmitButton>
      </form>
    </div>
  );
}
