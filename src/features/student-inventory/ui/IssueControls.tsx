// src/features/student-inventory/ui/IssueControls.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

import { INVENTORY_EN_TO_UA } from "@/entities/student-inventory/model/mapper";
import { INVENTORY_KINDS, type InventoryKind } from "@/entities/student-inventory/model/types";

type KindOption = { value: InventoryKind; label: string };

export type IssueControlsProps = {
  /**
   * Перелік видів для селекта. Якщо не передати або передати порожній — візьмемо INVENTORY_KINDS з моделі.
   */
  kinds?: ReadonlyArray<InventoryKind>;

  /**
   * Перелік видів, які ЗАРАЗ видані і можуть бути повернуті.
   * Якщо обраного виду тут немає — кнопку "Повернути" вимикаємо.
   */
  returnableKinds?: ReadonlyArray<InventoryKind>;

  onIssueAction: (kind: InventoryKind, qty: number) => void | Promise<void>;
  onReturnAction: (kind: InventoryKind, qty: number) => void | Promise<void>;
  onExportAction: () => void | Promise<void>;

  /**
   * Для сумісності з існуючим Section; не впливає на активність кнопок, окрім aria/data.
   */
  disabled?: boolean;
};

export function IssueControls({ kinds, returnableKinds = [], onIssueAction, onReturnAction, onExportAction, disabled }: IssueControlsProps) {
  // 1) нормалізуємо джерело опцій селекта
  const finalKinds: InventoryKind[] = Array.isArray(kinds) && kinds.length > 0 ? (kinds as InventoryKind[]) : INVENTORY_KINDS;

  const options: KindOption[] = useMemo(() => finalKinds.map((k) => ({ value: k, label: INVENTORY_EN_TO_UA[k] })), [finalKinds]);

  // 2) множина видів, які можна повертати (для O(1) перевірки)
  const returnableSet = useMemo(() => new Set<InventoryKind>(returnableKinds), [returnableKinds]);

  // 3) стейти
  const [kind, setKind] = useState<InventoryKind | undefined>(() => options[0]?.value);
  const [qty, setQty] = useState<number>(1);

  // 4) синхронізація вибору при зміні варіантів
  useEffect(() => {
    if (options.length === 0) {
      if (kind !== undefined) setKind(undefined);
      return;
    }
    if (kind === undefined || !options.some((o) => o.value === kind)) {
      setKind(options[0]?.value);
    }
  }, [options, kind]);

  // 5) обчислення доступності повернення:
  // — “Видати” ніколи не блокуємо (як і просив),
  // — “Повернути” блокуємо, якщо обраного виду немає серед виданих.
  const returnDisabled = !kind || !returnableSet.has(kind) || qty <= 0 || !Number.isFinite(qty);

  const dec = () => setQty((q) => Math.max(1, q - 1));
  const inc = () => setQty((q) => q + 1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" data-disabled={disabled ? "true" : "false"}>
      <div className="flex w-full flex-wrap items-stretch gap-4">
        {/* Select предмета */}
        <div className="basis-full sm:basis-[240px] md:basis-[280px]">
          <select
            value={kind ?? ""} // для UI плейсхолдера може бути ''
            onChange={(e) => {
              const v = e.target.value;
              setKind(v === "" ? undefined : (v as InventoryKind));
            }}
            className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-slate-900 focus:outline-none"
            aria-disabled={disabled ? true : undefined}
          >
            {options.length === 0 && (
              <option value="" disabled>
                Немає доступних видів
              </option>
            )}
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Лічильник кількості */}
        <div className="basis-auto">
          <div className="inline-flex h-11 items-stretch rounded-md border border-slate-300 bg-white overflow-hidden">
            <button type="button" onClick={dec} className="h-full px-3 text-slate-700 hover:bg-slate-100" aria-label="Зменшити">
              −
            </button>
            <div className="flex h-full min-w-[40px] select-none items-center justify-center text-center font-medium text-slate-700">{qty}</div>
            <button type="button" onClick={inc} className="h-full px-3 text-slate-700 hover:bg-slate-100" aria-label="Збільшити">
              +
            </button>
          </div>
        </div>

        {/* Кнопки дій */}
        <div className="min-w-[320px] flex-1">
          <div className="flex w-full flex-col gap-3 sm:flex-row">
            {/* Видати — завжди активна (захист лише всередині) */}
            <button
              type="button"
              onClick={async () => {
                if (!kind || qty <= 0 || !Number.isFinite(qty)) return;
                await onIssueAction(kind, qty);
                setQty(1);
              }}
              className="flex min-w-[140px] h-11 w-full items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 sm:flex-1"
              aria-disabled={disabled ? true : undefined}
            >
              Видати
            </button>

            {/* Повернути — вимикаємо, якщо немає такого виду серед виданих */}
            <button
              type="button"
              onClick={async () => {
                if (returnDisabled || !kind) return;
                await onReturnAction(kind, qty);
                setQty(1);
              }}
              disabled={returnDisabled}
              className="flex min-w-[140px] h-11 w-full items-center justify-center rounded-lg px-4 text-sm font-medium text-white sm:flex-1
                         bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 disabled:cursor-not-allowed"
              aria-disabled={returnDisabled || disabled ? true : undefined}
              title={!kind ? "Оберіть предмет" : !returnableSet.has(kind) ? "Цей предмет не числиться серед виданих — повертати нічого" : undefined}
            >
              Повернути
            </button>

            {/* Експорт */}
            <button
              type="button"
              onClick={onExportAction}
              className="flex min-w-[160px] h-11 w-full items-center justify-center rounded-lg bg-green-600 px-4 text-sm font-medium text-white hover:bg-green-700 sm:flex-1"
              aria-disabled={disabled ? true : undefined}
            >
              Арматурний Cписок
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
