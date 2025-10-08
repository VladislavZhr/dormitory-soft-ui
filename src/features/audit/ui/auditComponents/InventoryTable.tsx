// TypeScript strict
"use client";

import * as React from "react";

import { INVENTORY_UA_TO_EN, INVENTORY_EN_TO_UA } from "@/entities/student-inventory/model/mapper";
import { InventoryKindEnum, type InventoryKindUA } from "@/entities/student-inventory/model/types";

import type { StockItem } from "../../model/contracts";
import type { InventoryTableProps } from "../../model/types";

/**
 * Локальний тип пропсів: підміняємо старі onChangeAvail/AvailableEditor
 * на onChangeTotal/новий Editor, не ламаючи решту контрактів.
 */
type EditorComponent = (p: { total: number; onChangeTotal: (v: number) => void; onSave: () => void }) => React.JSX.Element;

type Props = Omit<InventoryTableProps, "onChangeAvail" | "AvailableEditor"> & {
  onChangeTotal: (id: number, v: number) => void;
  AvailableEditor: EditorComponent;
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
function toNum(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}
function baseAvailable(i: StockItem): number {
  const total = toNum(i.total);
  // UI-тип гарантує наявність available; все ж обмежимо діапазон
  return clamp(toNum(i.available), 0, total);
}

export default function InventoryTable({ stock, sums, editingAvail, onChangeTotal, onSaveAvail, AvailableEditor, normalizeNames = true }: Props): React.JSX.Element {
  const resolveLabel = React.useCallback(
    (raw: string): string => {
      if (!normalizeNames) return raw;
      const enumKey = (INVENTORY_UA_TO_EN as Record<string, InventoryKindEnum | undefined>)[raw];
      if (enumKey) {
        const ua = INVENTORY_EN_TO_UA[enumKey] as InventoryKindUA | undefined;
        if (ua) return ua;
      }
      return raw;
    },
    [normalizeNames],
  );

  return (
    <>
      <div className="flex items-center justify-between border-b border-slate-100 p-4">
        <h2 className="text-base font-semibold text-slate-900">Поточний склад</h2>
        <span className="text-sm text-slate-500">Коригування змінює «Загалом»</span>
      </div>

      <div className="max-h-[65vh] overflow-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600">
            <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:font-medium text-center">
              <th className="w-[40%] text-left">Предмет</th>
              <th className="w-[15%]">Видано</th>
              <th className="w-[15%]">Доступно</th>
              <th className="w-[15%]">Загалом</th>
              <th className="w-[15%]">Коригування</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {stock.map((item) => {
              const label = resolveLabel(item.name);

              // 1) Оригінальні значення (як прийшли зі стоку)
              const totalOriginal = toNum(item.total);
              const availableOriginal = baseAvailable(item);
              const issuedOriginal = totalOriginal - availableOriginal;

              // 2) Відредагований total (тимчасово зберігаємо його в editingAvail[id])
              const editedTotalRaw = editingAvail[item.id];
              const totalForRow = typeof editedTotalRaw === "number" ? Math.max(0, Math.trunc(editedTotalRaw)) : totalOriginal;

              // 3) Фіксуємо issued, а available = total - issued (із clamp у [0..total])
              const issuedShown = Math.min(issuedOriginal, totalForRow);
              const availableShown = clamp(totalForRow - issuedShown, 0, totalForRow);

              const isZeroAvail = availableShown === 0;
              const isLowAvail = availableShown > 0 && availableShown <= 5;

              return (
                <tr key={item.id} className={`text-center hover:bg-slate-50 ${isZeroAvail ? "bg-rose-50/50" : ""}`}>
                  <td className="px-4 py-3 text-left font-medium text-slate-900">
                    {label}
                    {label !== item.name && (
                      <span className="ml-2 align-middle text-[11px] text-slate-400" title={`Оригінальна назва: ${item.name}`}>
                        (нормалізовано)
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-slate-700">{issuedShown}</td>

                  <td className="px-4 py-3 text-slate-700">
                    <div className="flex items-center justify-center gap-2">
                      <span>{availableShown}</span>
                      {isZeroAvail && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">0</span>}
                      {isLowAvail && !isZeroAvail && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">мало</span>}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-slate-700">{totalForRow}</td>

                  <td className="px-4 py-3">
                    <AvailableEditor total={totalForRow} onChangeTotal={(v) => onChangeTotal(item.id, v)} onSave={() => onSaveAvail(item.id)} />
                  </td>
                </tr>
              );
            })}
          </tbody>

          <tfoot>
            <tr className="bg-slate-50 text-center font-medium text-slate-800">
              <td className="px-4 py-3 text-right">Підсумок:</td>
              <td className="px-4 py-3">{sums.sumIssued}</td>
              <td className="px-4 py-3">{sums.sumAvailable}</td>
              <td className="px-4 py-3">{sums.sumTotal}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}
