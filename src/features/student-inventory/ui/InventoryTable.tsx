"use client";

import { INVENTORY_EN_TO_UA } from "@/entities/student-inventory/model/mapper";
import type { InventoryKind } from "@/entities/student-inventory/model/types";

type AggregatedItem = {
  kind: InventoryKind;
  qty: number;
};

export default function InventoryTable({ rows }: { rows: ReadonlyArray<AggregatedItem> }) {
  const safeRows: AggregatedItem[] = Array.isArray(rows)
    ? rows
        .filter((r): r is AggregatedItem => !!r && typeof r === "object" && typeof (r as AggregatedItem).kind === "string" && Number.isFinite((r as AggregatedItem).qty))
        .slice()
        .sort((a, b) => {
          const labelA = INVENTORY_EN_TO_UA[a.kind] ?? a.kind;
          const labelB = INVENTORY_EN_TO_UA[b.kind] ?? b.kind;
          return labelA.localeCompare(labelB, "uk");
        })
    : [];

  // обчислюємо висоту для скролу: 5 рядків + заголовок
  const maxBodyH = safeRows.length > 5 ? 56 * 5 + 52 : undefined;

  return (
    <div className="min-w-[49%] rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative overflow-x-auto" style={maxBodyH ? { maxHeight: maxBodyH, overflowY: "auto" } : undefined}>
        <table className="min-w-full table-fixed border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50 text-slate-700">
            <tr className="[&>th]:px-4 [&>th]:py-3 text-xs uppercase tracking-wide">
              <th className="w-[60%] text-center">Предмет</th>
              <th className="w-[40%] text-center">Кількість</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {safeRows.map((r) => {
              const label = INVENTORY_EN_TO_UA[r.kind] ?? r.kind;
              return (
                <tr key={r.kind} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-center text-slate-800">{label}</td>
                  <td className="px-4 py-3 text-center font-medium text-slate-900">{r.qty}</td>
                </tr>
              );
            })}

            {safeRows.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-6 text-center text-slate-500">
                  Немає активних позицій
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
