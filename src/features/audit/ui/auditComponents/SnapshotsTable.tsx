// src/features/audit/ui/auditComponents/SnapshotsTable.tsx
"use client";

import * as React from "react";

import type { AuditId } from "../../model/contracts";
import type { SnapshotsTableProps } from "../../model/types";

export default function SnapshotsTable({
  snaps,
  onView, // опційно: передати готовий Snapshot
  onViewById, // опційно: контейнер робить GET по id (UUID)
  onDelete,
  loading,
  errorMessage,
  isDeleting = () => false,
}: SnapshotsTableProps) {
  const fmt = React.useMemo(() => new Intl.DateTimeFormat("uk-UA", { year: "numeric", month: "2-digit", day: "2-digit" }), []);

  const handleView = React.useCallback(
    (id: AuditId) => {
      if (onViewById) {
        onViewById(id); // передаємо як є (UUID-рядок)
        return;
      }
      if (onView) {
        const s = snaps.find((x) => String(x.id) === String(id));
        if (s) onView(s);
      }
    },
    [onViewById, onView, snaps],
  );

  return (
    <>
      <div className="flex items-center justify-between border-b border-slate-100 p-4">
        <h2 className="text-base font-semibold text-slate-900">Історія інвентаризацій</h2>
        <span className="text-sm text-slate-500">ID / Дата / Дії</span>
      </div>

      {loading ? (
        <div className="p-4 text-sm text-slate-500" role="status" aria-live="polite">
          Завантаження…
        </div>
      ) : errorMessage ? (
        <div className="flex items-center justify-between gap-3 p-4">
          <div className="text-sm text-rose-600">Помилка: {errorMessage}</div>
        </div>
      ) : (
        <div className="max-h-[65vh] overflow-auto">
          <table className="min-w-full border-collapse text-left text-sm" role="table" aria-label="Таблиця історії інвентаризацій">
            <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600">
              <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:font-medium">
                <th scope="col" className="w-[40%]">
                  ID
                </th>
                <th scope="col" className="w-[30%]">
                  Дата
                </th>
                <th scope="col" className="w-[30%] text-center">
                  Дії
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {snaps.map((s) => {
                const idStr = String(s.id); // показуємо як рядок (UUID повністю)
                const d = new Date(s.date);
                const dateDisplay = Number.isNaN(d.valueOf()) ? s.date : fmt.format(d);
                const deleting = isDeleting?.(s.id) ?? false;

                return (
                  <tr key={idStr} className="hover:bg-slate-50">
                    <th scope="row" className="px-4 py-3 font-mono break-all font-medium text-slate-900" title={idStr}>
                      {idStr}
                    </th>

                    <td className="px-4 py-3 text-slate-800">
                      <time dateTime={s.date}>{dateDisplay}</time>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleView(s.id)}
                          className="rounded-lg border border-slate-300 bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                          aria-label={`Переглянути аудит ${idStr}`}
                        >
                          Переглянути
                        </button>

                        <button
                          type="button"
                          onClick={() => onDelete(s.id)}
                          disabled={deleting}
                          aria-busy={deleting}
                          className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                          aria-label={deleting ? `Видалення аудиту ${idStr}` : `Видалити аудит ${idStr}`}
                        >
                          {deleting ? "Видалення…" : "Видалити"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {snaps.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                    Записів ще немає. Створіть перший через «Підрахувати залишки».
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
