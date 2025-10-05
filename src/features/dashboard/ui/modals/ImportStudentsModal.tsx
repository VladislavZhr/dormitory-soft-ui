"use client";

import { useMutation } from "@tanstack/react-query";
import * as React from "react";
import { createPortal } from "react-dom";

import { importStudents } from "../../api/client";
import { mapError } from "../../lib/mapError";

type ImportStudentsModalProps = {
  open: boolean;
  onClose: () => void;
  /** Опційно: що робити після успішного імпорту (напр., інвалідувати кеш у контейнері) */
  onImported?: (payload: { imported: number }) => void;
};

export default function ImportStudentsModal({ open, onClose, onImported }: ImportStudentsModalProps) {
  const [mounted, setMounted] = React.useState(false); // SSR guard
  const [file, setFile] = React.useState<File | null>(null);
  const [rootError, setRootError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

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

  // При відкритті модалки — очищаємо вибір і помилки
  React.useEffect(() => {
    if (!open) {
      setFile(null);
      setRootError(null);
    }
  }, [open]);

  const mutation = useMutation<{ imported: number }, unknown, File>({
    mutationFn: (f) => importStudents(f),
    onSuccess: (res) => {
      onImported?.(res);
      setFile(null);
      onClose();
    },
    onError: (err) => {
      const fe = mapError(err);
      setRootError(fe._root ?? "Не вдалося імпортувати файл. Спробуйте ще раз.");
    },
  });

  if (!open) return null;

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRootError(null);
    setFile(e.target.files?.[0] ?? null);
  };

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setRootError(null);
    const f = e.dataTransfer.files?.[0] ?? null;
    if (f) setFile(f);
  };

  const onUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || mutation.isPending) return;
    setRootError(null);
    mutation.mutate(file);
  };

  const prettySize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const content = (
    <div role="dialog" aria-modal="true" aria-labelledby="import-title" className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <button aria-hidden className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" tabIndex={-1} />
      <div
        className="
          relative w-full max-w-xl
          rounded-2xl border border-white/30
          bg-white/85 shadow-2xl backdrop-blur-md
          ring-1 ring-white/20 dark:bg-slate-900/70
        "
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.86) 60%, rgba(225,239,254,0.80) 100%)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/30 p-5">
          <h2 id="import-title" className="text-xl font-semibold text-slate-900">
            Імпорт студентів
          </h2>
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

        <form onSubmit={onUpload} className="p-5" noValidate>
          {rootError && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{rootError}</div>}

          <label
            htmlFor="student-file"
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="
              flex cursor-pointer flex-col items-center justify-center
              rounded-xl border-2 border-dashed border-slate-300 bg-white/70
              px-4 py-10 text-center transition
              hover:bg-white/90 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-300
            "
          >
            <input id="student-file" ref={inputRef} type="file" accept=".csv,.xlsx,.xls" onChange={onFileChange} className="sr-only" />
            <div className="space-y-2">
              <div className="text-5xl">📄</div>
              <p className="text-sm text-slate-700">
                Перетягніть файл сюди або <span className="font-semibold text-blue-700 underline underline-offset-2">натисніть</span> щоб обрати
              </p>
              <p className="text-xs text-slate-500">Підтримуються: .csv, .xlsx, .xls</p>
            </div>
          </label>

          {file && (
            <div className="mt-4 rounded-lg border border-slate-200 bg-white/90 p-3">
              <p className="text-sm text-slate-800">
                <span className="font-medium">Файл:</span> {file.name} <span className="text-slate-500">({prettySize(file.size)})</span>
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="
                inline-flex items-center justify-center
                rounded-lg border border-slate-300 bg-white/90
                px-4 py-2 text-sm font-medium text-slate-700
                hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200
              "
            >
              Змінити файл
            </button>

            <button
              type="submit"
              disabled={!file || mutation.isPending}
              className={`
                inline-flex items-center justify-center rounded-lg px-4 py-2
                text-sm font-semibold shadow-sm focus:outline-none focus:ring-2
                ${!file || mutation.isPending ? "cursor-not-allowed bg-slate-300 text-slate-600" : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-300"}
              `}
            >
              {mutation.isPending ? "Завантаження…" : "Завантажити студентів"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return mounted ? createPortal(content, document.body) : null;
}
