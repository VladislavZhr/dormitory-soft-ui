// src/features/dashboard/ui/modals/ExportStudentsModal.tsx
"use client";

import * as React from "react";
import { createPortal } from "react-dom";

import { downloadAssignedXlsx } from "@/features/dashboard/api/client"; // ⬅ NEW

type ExportStudentsModalProps = {
  open: boolean;
  onClose: () => void;
  /**
   * Якщо хочеш ззовні передати власний обробник — можна.
   * Якщо не передавати, модалка сама викличе downloadAssignedXlsx().
   */
  onConfirm?: () => Promise<void> | void; // ⬅ CHANGED (тепер опційний)
  /** Зовнішній індикатор процесу (об’єднується з локальним) */
  isProcessing?: boolean;
  /** Опційне імʼя файлу для завантаження */
  fileName?: string; // ⬅ NEW
};

export default function ExportStudentsModal({ open, onClose, onConfirm, isProcessing = false, fileName = "assigned.xlsx" }: ExportStudentsModalProps) {
  const [mounted, setMounted] = React.useState(false); // SSR guard
  const [busy, setBusy] = React.useState(false); // ⬅ NEW локальний стан
  const abortRef = React.useRef<AbortController | null>(null); // ⬅ NEW

  const processing = isProcessing || busy; // ⬅ об’єднання індикаторів

  React.useEffect(() => setMounted(true), []);

  // Escape для закриття
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose(); // ⬅ перехоплюємо, щоб абортнути
      if (e.key === "Enter") void handleConfirm(); // ⬅ при Enter — підтвердити
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, processing]);

  // Блокування скролу сторінки під час відкриття
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleClose = () => {
    // якщо триває запит — перериваємо
    abortRef.current?.abort(); // ⬅ NEW
    onClose();
  };

  const handleConfirm = async () => {
    if (processing) return;

    // Якщо користувач передав свій onConfirm — викликаємо його.
    if (onConfirm) {
      try {
        setBusy(true);
        await onConfirm();
      } finally {
        setBusy(false);
      }
      return;
    }

    // Інакше — робимо вбудований експорт XLSX:
    setBusy(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await downloadAssignedXlsx({
        fileName,
        signal: controller.signal,
      });
      handleClose(); // авто-закриття після успіху
    } catch (e) {
      // тут можеш підключити свій toast
      console.error("[ExportStudentsModal] export failed:", e);
    } finally {
      abortRef.current = null;
      setBusy(false);
    }
  };

  if (!open) return null;

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-title"
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      onClick={handleClose} // ⬅ оновили, щоб абортити
    >
      <button aria-hidden className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" tabIndex={-1} />
      <div
        className="
          relative w-full max-w-md
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
          <h2 id="export-title" className="text-xl font-semibold text-slate-900">
            Експорт студентів
          </h2>
          <button
            onClick={handleClose} // ⬅ оновили
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

        <div className="p-5">
          <p className="text-sm text-slate-800">Ви впевнені, що хочете експортувати поточний список студентів до Excel (CSV)?</p>
          <p className="mt-2 text-xs text-slate-600">Порада: якщо застосовані фільтри, буде експортовано лише видимі записи.</p>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={processing}
              className="
                inline-flex items-center justify-center
                rounded-lg border border-slate-300 bg-white/90
                px-4 py-2 text-sm font-medium text-slate-700
                hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200
                disabled:cursor-not-allowed disabled:opacity-60
              "
            >
              Скасувати
            </button>

            <button
              type="button"
              onClick={handleConfirm} // ⬅ головний триґер
              disabled={processing}
              className={`
                inline-flex items-center justify-center gap-2
                rounded-lg px-4 py-2 text-sm font-semibold shadow-sm
                focus:outline-none focus:ring-2
                ${processing ? "cursor-not-allowed bg-purple-300 text-white" : "border border-purple-300 bg-white text-purple-700 hover:bg-purple-50 focus:ring-purple-300"}
              `}
            >
              {!processing ? (
                <>
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="currentColor">
                    <path d="M12 3a1 1 0 0 1 1 1v8.586l2.293-2.293a1 1 0 1 1 1.414 1.414l-4.007 4.007a1 1 0 0 1-1.414 0L7.279 11.707a1 1 0 0 1 1.414-1.414L11 12.586V4a1 1 0 0 1 1-1z"></path>
                    <path d="M5 15a1 1 0 0 1 1 1v2h12v-2a1 1 0 1 1 2 0v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1z"></path>
                  </svg>
                  Експортувати
                </>
              ) : (
                "Експорт…"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return mounted ? createPortal(content, document.body) : null;
}
