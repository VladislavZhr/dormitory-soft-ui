// src/features/inventory/ui/modals/AddStockItemModal.tsx
"use client";

import * as React from "react";

import { labelInventoryKind } from "@/entities/student-inventory/model/mapper";
import { InventoryKindEnum, INVENTORY_KINDS } from "@/entities/student-inventory/model/types";

import { createStockItem } from "../../api/client";
import type { AddStockItemModalProps } from "../../model/types";

// 🔽 нове: тягнемо запит з client.ts

export default function AddStockItemModal({ open, onClose }: AddStockItemModalProps) {
  const [kind, setKind] = React.useState<InventoryKindEnum | "">("");
  const [total, setTotal] = React.useState<string>("0");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setKind("");
      setTotal("0");
      setError(null);
    }
  }, [open]);

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

  const validate = (): string | null => {
    if (!kind) return "Оберіть тип предмета";
    const n = Number(total);
    if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) return "Кількість має бути цілим невід’ємним числом";
    return null;
  };

  const handleSubmit = async () => {
    if (busy) return;
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError(null);
    setBusy(true);

    try {
      await createStockItem({ kind: kind as InventoryKindEnum, total: Number(total) });
      onClose();
    } catch (e) {
      console.error("[AddStockItemModal] create failed:", e);
      setError(e instanceof Error ? e.message : "Сталася помилка");
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="add-stock-title" className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div aria-hidden className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 id="add-stock-title" className="text-lg font-semibold text-slate-900">
            Додати предмет на склад
          </h3>
          <button onClick={onClose} aria-label="Закрити" className="-m-2 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="kind" className="mb-1 block text-sm font-medium text-slate-700">
              Тип предмета
            </label>
            <select
              id="kind"
              className="w-full rounded-lg text-slate-900 border border-slate-300 px-3 py-2 text-sm"
              value={kind}
              onChange={(e) => setKind(e.target.value as InventoryKindEnum)}
              disabled={busy}
            >
              <option value="" disabled>
                Оберіть зі списку…
              </option>
              {INVENTORY_KINDS.map((k) => (
                <option key={k} value={k}>
                  {labelInventoryKind(k)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="total" className="mb-1 block text-sm font-medium text-slate-700">
              Кількість (total)
            </label>
            <input
              id="total"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              className="w-full text-slate-900 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              disabled={busy}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleSubmit();
                }
              }}
            />
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60">
            Скасувати
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={busy}
            className={`rounded-lg px-3 py-2 text-sm font-medium text-white ${busy ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            {busy ? "Збереження…" : "Зберегти"}
          </button>
        </div>
      </div>
    </div>
  );
}
