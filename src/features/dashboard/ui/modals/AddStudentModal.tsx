"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import * as React from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";

import { addStudent } from "../../api/client";
import { mapError } from "../../lib/mapError";
import type { Student } from "../../model/contracts";
import type { AddStudentModalProps } from "../../model/contracts";
// eslint-disable-next-line import/order
import { studentCreateSchema } from "../../model/schema";

// 1) Формальні типи для RHF з урахуванням z.coerce.number()
//    - FormInput  = те, що вводить користувач (до валідації/коерсії)
//    - FormOutput = те, що повертає Zod після парсингу (потрібно мутації)
import type { FormInput } from "../../model/schema";
import type { FormOutput } from "../../model/schema";

export default function AddStudentModal({ open, onClose, onSubmit }: AddStudentModalProps) {
  const {
    register,
    handleSubmit,
    setError,
    reset,
    setFocus,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(studentCreateSchema),
    mode: "onChange",
    defaultValues: {
      fullName: "",
      roomNumber: "",
      faculty: "",
      studyGroup: "",
    } as unknown as FormInput,
  });

  const [rootError, setRootError] = React.useState<string | null>(null);

  // 2) Мутація приймає саме FormOutput (після коерсії)
  const mutation = useMutation<Student, unknown, FormOutput>({
    mutationFn: (vars) => addStudent(vars),
    onSuccess: (_created, variables) => {
      onSubmit?.(variables);
      reset();
      onClose();
    },
    onError: (err: unknown) => {
      const fe = mapError(err);
      if (fe._root) setRootError(fe._root);
      // Поля можуть не збігатися за ключами — підкажемо TS, що це ключі форми
      (Object.entries(fe) as Array<[keyof FormOutput | "_root", string]>).forEach(([field, message]) => {
        if (field === "_root") return;
        setError(field, { type: "server", message });
      });
    },
  });

  // 3) handleSubmit повертає у колбек саме FormOutput
  const onSubmitForm = handleSubmit((values: FormOutput) => {
    setRootError(null);
    mutation.mutate(values);
  });

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  React.useEffect(() => {
    if (open) setFocus("fullName");
  }, [open, setFocus]);

  if (!open) return null;

  const content = (
    <div role="dialog" aria-modal="true" aria-labelledby="add-student-title" className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div aria-hidden className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <div
        className="
          relative w-full max-w-xl
          rounded-2xl border border-white/30
          bg-white/85 shadow-2xl backdrop-blur-md
          ring-1 ring-white/20
          dark:bg-slate-900/70
        "
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.86) 60%, rgba(225,239,254,0.80) 100%)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/30 p-5">
          <div>
            <h2 id="add-student-title" className="text-xl font-semibold text-slate-900">
              Додати студента
            </h2>
            <p className="mt-1 text-sm text-slate-600">Заповніть поля і натисніть «Зберегти».</p>
          </div>

          <button
            onClick={onClose}
            aria-label="Закрити модальне вікно"
            className="
              -m-2 rounded-lg p-2
              text-slate-500 hover:text-slate-700
              hover:bg-slate-200/60 focus:outline-none focus:ring-2 focus:ring-blue-400
            "
          >
            ✕
          </button>
        </div>

        <form className="p-5" onSubmit={onSubmitForm} noValidate>
          {rootError && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{rootError}</div>}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label htmlFor="fullName" className="mb-1 block text-sm font-medium text-slate-800">
                ПІБ <span className="text-red-500">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                placeholder="Іваненко Іван Іванович"
                aria-invalid={!!errors.fullName}
                {...register("fullName")}
                className="
                  w-full rounded-lg border border-slate-300 bg-white/90 px-3 py-2
                  text-sm text-slate-900 placeholder:text-slate-400
                  focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200
                "
              />
              {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>}
            </div>

            <div>
              <label htmlFor="roomNumber" className="mb-1 block text-sm font-medium text-slate-800">
                Кімната <span className="text-red-500">*</span>
              </label>
              <input
                id="roomNumber"
                type="text"
                placeholder="A-212"
                aria-invalid={!!errors.roomNumber}
                {...register("roomNumber")}
                className="
                  w-full rounded-lg border border-slate-300 bg-white/90 px-3 py-2
                  text-sm text-slate-900 placeholder:text-slate-400
                  focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200
                "
              />
              {errors.roomNumber && <p className="mt-1 text-xs text-red-600">{errors.roomNumber.message}</p>}
            </div>

            <div>
              <label htmlFor="faculty" className="mb-1 block text-sm font-medium text-slate-800">
                Факультет <span className="text-red-500">*</span>
              </label>
              <input
                id="faculty"
                type="text"
                placeholder="ФІОТ"
                aria-invalid={!!errors.faculty}
                {...register("faculty")}
                className="
                  w-full rounded-lg border border-slate-300 bg-white/90 px-3 py-2
                  text-sm text-slate-900 placeholder:text-slate-400
                  focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200
                "
              />
              {errors.faculty && <p className="mt-1 text-xs text-red-600">{errors.faculty.message}</p>}
            </div>

            <div>
              <label htmlFor="studyGroup" className="mb-1 block text-sm font-medium text-slate-800">
                Група <span className="text-red-500">*</span>
              </label>
              <input
                id="studyGroup"
                type="text"
                placeholder="КП-12"
                aria-invalid={!!errors.studyGroup}
                {...register("studyGroup")}
                className="
                  w-full rounded-lg border border-slate-300 bg-white/90 px-3 py-2
                  text-sm text-slate-900 placeholder:text-slate-400
                  focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200
                "
              />
              {errors.studyGroup && <p className="mt-1 text-xs text-red-600">{errors.studyGroup.message}</p>}
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => {
                reset();
                onClose();
              }}
              className="
                inline-flex items-center justify-center
                rounded-lg border border-slate-300 bg-white/90
                px-4 py-2 text-sm font-medium text-slate-700
                hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200
              "
            >
              Скасувати
            </button>

            <button
              type="submit"
              disabled={isSubmitting || mutation.isPending || !isValid}
              className="
                inline-flex items-center justify-center
                rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white
                shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300
                disabled:cursor-not-allowed disabled:opacity-60
              "
            >
              {mutation.isPending ? "Збереження…" : "Зберегти"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return mounted ? createPortal(content, document.body) : null;
}
