"use client";

import * as React from "react";

import { today } from "../../lib/today";
import type { InventoryModalProps } from "../../model/types";

export default function InventoryModal({ open, onClose, onConfirm, defaultDate = today(), isSubmitting = false }: InventoryModalProps) {
  const [date, setDate] = React.useState<string>(defaultDate);

  // Синхронізуємо дату при відкритті/зміні defaultDate
  React.useEffect(() => {
    if (open) setDate(defaultDate);
  }, [open, defaultDate]);

  // Закриття по Escape
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Сабміт з Enter у полі вводу
  const onKeyDownInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isSubmitting) {
      e.preventDefault();
      onConfirm(date);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="inventory-modal-title" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />

      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()} // не закривати при кліку всередині
      >
        <h3 id="inventory-modal-title" className="mb-4 text-lg font-semibold text-slate-900">
          Підрахунок залишків
        </h3>

        <label htmlFor="inventory-date" className="mb-1 block text-sm font-medium text-slate-700">
          Дата інвентаризації
        </label>
        <input
          id="inventory-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          onKeyDown={onKeyDownInput}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none"
        />

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
            Скасувати
          </button>

          <button
            type="button"
            onClick={() => onConfirm(date)}
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Створення…" : "Підрахувати"}
          </button>
        </div>
      </div>
    </div>
  );
}
