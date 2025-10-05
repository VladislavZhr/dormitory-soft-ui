"use client";

import { useMemo } from "react";

import { INVENTORY_EN_TO_UA } from "@/entities/student-inventory/model/mapper";
import type { InventoryHistoryRow } from "@/entities/student-inventory/model/types";

function toTs(iso?: string) {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isNaN(t) ? 0 : t;
}
function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("uk-UA");
}

export default function InventoryHistoryTable({ rows }: { rows: InventoryHistoryRow[] }) {
  const safeRows = useMemo(
    () =>
      (rows ?? [])
        .filter((r) => r && typeof r === "object")
        .slice()
        .sort((a, b) => toTs(b.date) - toTs(a.date)),
    [rows],
  );

  // обмежуємо висоту для скролу (≈5 рядків + шапка)
  const maxBodyH = safeRows.length > 5 ? 56 * 6 + 52 : undefined;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm min-w-[49%]">
      <div className="relative overflow-x-auto" style={maxBodyH ? { maxHeight: maxBodyH, overflowY: "auto" } : undefined}>
        <table className="min-w-full table-fixed border-collapse text-sm">
          <thead className="bg-slate-50 text-slate-700 sticky top-0 z-10">
            <tr className="[&>th]:px-4 [&>th]:py-3 text-xs uppercase tracking-wide">
              <th className="w-[30%]">Дата</th>
              <th className="w-[20%]">Операція</th>
              <th className="w-[30%]">Предмет</th>
              <th className="w-[20%] text-center">Кількість</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {safeRows.map((r, idx) => {
              const key = r.id || `${r.kind}#${r.op}#${r.date}#${idx}`;
              const label = INVENTORY_EN_TO_UA[r.kind] ?? r.kind;
              return (
                <tr key={key} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700 text-center">{formatDate(r.date)}</td>
                  <td className="px-4 py-3 text-center">
                    {r.op === "issued" ? (
                      <span className="inline-flex items-center rounded-full bg-blue-600/10 px-2.5 py-1 text-xs font-medium text-blue-700">Видано</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-emerald-600/10 px-2.5 py-1 text-xs font-medium text-emerald-700">Повернено</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-800">{label}</td>
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
