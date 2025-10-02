'use client';

import { useMemo } from 'react';

import type { InventoryHistoryRow } from '@/entities/student-inventory/model/types';

function toTs(iso?: string) {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isNaN(t) ? 0 : t;
}
function formatDate(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.toLocaleDateString('uk-UA')} ${d.toLocaleTimeString('uk-UA', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

export default function InventoryHistoryTable({ rows }: { rows: InventoryHistoryRow[] }) {
  const safeRows = useMemo(
    () =>
      (rows ?? [])
        .filter((r) => r && typeof r === 'object')
        // новіші події зверху, без localeCompare
        .slice()
        .sort((a, b) => toTs(b.date) - toTs(a.date)),
    [rows],
  );

  return (
    <div className="min-w-[49%] rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative overflow-x-auto">
        <table className="min-w-full table-fixed border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50 text-slate-700">
            <tr className="[&>th]:px-4 [&>th]:py-3 text-xs uppercase tracking-wide">
              <th className="w-[30%] text-center">Дата</th>
              <th className="w-[20%] text-center">Операція</th>
              <th className="w-[30%] text-center">Предмет</th>
              <th className="w-[20%] text-center">Кількість</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {safeRows.map((r, idx) => {
              const key = r.id || `${r.kind || ''}#${r.op || ''}#${r.date || ''}#${idx}`;
              return (
                <tr key={key} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-center text-slate-700">{formatDate(r.date)}</td>
                  <td className="px-4 py-3 text-center">
                    {r.op === 'issued' ? (
                      <span className="inline-flex rounded-full bg-blue-600/10 px-2.5 py-1 text-xs font-medium text-blue-700">
                        Видано
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-emerald-600/10 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        Повернено
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-800">{r.kind ?? '—'}</td>
                  <td className="px-4 py-3 text-center text-slate-700">{r.quantity ?? 0}</td>
                </tr>
              );
            })}

            {safeRows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                  Історія порожня
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
