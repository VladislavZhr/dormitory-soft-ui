"use client";

import * as React from "react";

// ✅ підключаємо мапери з сутності (опційно-безпечне використання)
import { INVENTORY_UA_TO_EN, INVENTORY_EN_TO_UA } from "@/entities/student-inventory/model/mapper";
import { InventoryKindEnum, InventoryKindUA } from "@/entities/student-inventory/model/types";

import type { InventoryTableProps } from "../../model/types";

export default function InventoryTable({ stock, sums, editingAvail, onChangeAvail, onSaveAvail, AvailableEditor, normalizeNames = true }: InventoryTableProps) {
  const resolveLabel = React.useCallback(
    (raw: string): string => {
      if (!normalizeNames) return raw;

      // 1) пробуємо знайти відповідний enum для укр-лейблу
      //    (наприклад, "Рушник махровий" -> "terryTowel")
      const enumKey = (INVENTORY_UA_TO_EN as Record<string, InventoryKindEnum | undefined>)[raw];
      if (enumKey) {
        // 2) повертаємо «правильний» укр-лейбл (на випадок різних варіантів написання)
        const ua = INVENTORY_EN_TO_UA[enumKey] as InventoryKindUA | undefined;
        if (ua) return ua;
      }
      // fallback: показуємо, що прийшло від бекенда
      return raw;
    },
    [normalizeNames],
  );

  return (
    <>
      <div className="flex items-center justify-between border-b border-slate-100 p-4">
        <h2 className="text-base font-semibold text-slate-900">Поточний склад</h2>
        <span className="text-sm text-slate-500">Коригування змінює «Доступно»</span>
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
              const available = item.total - item.issued;
              const currentAvail = editingAvail[item.id] ?? available;
              const isZeroAvail = currentAvail === 0;
              const isLowAvail = currentAvail > 0 && currentAvail <= 5;

              const label = resolveLabel(item.name);

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

                  <td className="px-4 py-3 text-slate-700">{item.issued}</td>

                  <td className="px-4 py-3 text-slate-700">
                    <div className="flex items-center justify-center gap-2">
                      <span>{available}</span>
                      {isZeroAvail && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">0</span>}
                      {isLowAvail && !isZeroAvail && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">мало</span>}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-slate-700">{item.total}</td>

                  <td className="px-4 py-3">
                    <AvailableEditor value={currentAvail} onChange={(v) => onChangeAvail(item.id, v)} onSave={() => onSaveAvail(item.id)} />
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
