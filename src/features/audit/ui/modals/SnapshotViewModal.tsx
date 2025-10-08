"use client";

import * as React from "react";

import type { SnapshotViewModalProps } from "../../model/types";

export default function SnapshotViewModal({ open, snapshot, onClose, onExportClick, onDelete, isDeleting = false }: SnapshotViewModalProps) {
  // Не монтуємо DOM, якщо модалка закрита або нема даних
  if (!open || !snapshot) return null;

  // Закриття по Escape
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Зупинити "пробій" кліку всередині картки
  const stop = (e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation();

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="snapshot-title" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative w-full max-w-3xl rounded-2xl bg-white p-5 shadow-2xl" onClick={stop}>
        {/* Header */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 id="snapshot-title" className="text-lg font-semibold text-slate-900">
            Інвентаризація від {snapshot.date}
          </h3>

          <div className="flex items-center gap-2">
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                disabled={isDeleting}
                aria-busy={isDeleting}
                className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? "Видалення…" : "Видалити"}
              </button>
            )}
            <button type="button" onClick={onExportClick} className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50">
              Експорт в Excel
            </button>
          </div>
        </div>

        {/* Sums */}
        <div className="mb-2 text-sm text-slate-600">
          Видано: <span className="font-medium text-slate-800">{snapshot.sumIssued}</span> • Доступно: <span className="font-medium text-slate-800">{snapshot.sumAvailable}</span> • Загалом:{" "}
          <span className="font-medium text-slate-800">{snapshot.sumTotal}</span>
        </div>

        {/* Table */}
        <div className="max-h-[60vh] overflow-auto rounded-md border border-slate-200">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-slate-600">
              <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:font-medium text-center">
                <th scope="col" className="w-[30%]">
                  Предмет
                </th>
                <th scope="col" className="w-[16%] text-center">
                  Видано
                </th>
                <th scope="col" className="w-[17%] text-center">
                  Доступно
                </th>
                <th scope="col" className="w-[17%] text-center">
                  Загалом
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {snapshot.rows.map((r, i) => (
                <tr key={`${r.name}-${i}`} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-center text-slate-900">{r.name}</td>
                  <td className="px-4 py-3 text-center text-slate-700">{r.issued}</td>
                  <td className="px-4 py-3 text-center text-slate-700">{r.available}</td>
                  <td className="px-4 py-3 text-center text-slate-700">{r.total}</td>
                </tr>
              ))}
              {snapshot.rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                    Порожньо
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-4 flex justify-end">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
}
