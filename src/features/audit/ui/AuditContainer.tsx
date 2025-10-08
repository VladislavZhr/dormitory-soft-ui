// src/features/audit/ui/AuditContainer.tsx
// TypeScript strict
"use client";

import { useQueryClient } from "@tanstack/react-query";
import * as React from "react";

import { INVENTORY_UA_TO_EN, labelInventoryKind } from "@/entities/student-inventory/model/mapper";
import { isInventoryKind, type InventoryKindEnum } from "@/entities/student-inventory/model/types";

import { fetchAuditById, deleteAudit } from "../api/client";
import { useAuditsQuery, useCreateAuditMutation, useStockQuery, useUpsertStockMutation, stockKeys } from "../api/hooks";
import { exportSnapshotToXLSX } from "../lib/exportXlsx";
import { today } from "../lib/today";
import type { StockItem, Snapshot, AuditId } from "../model/contracts";

import AuditView from "./AuditView";
import AddStockItemModal from "./modals/AddStockItemModal";

// ---- helpers (без any) ------------------------------------------------------
type StockLike = StockItem & { issued?: number };

function toNum(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}
function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
function getAvail(item: StockLike): number {
  const total = toNum(item.total);
  const a = typeof item.available === "number" ? item.available : undefined;
  const i = typeof item.issued === "number" ? item.issued : undefined;
  const base = a ?? (typeof i === "number" ? total - toNum(i) : 0);
  return clamp(toNum(base), 0, total);
}
/** Поточне issued від бекових даних (не редагуємо його в UI) */
function getIssued(item: StockLike): number {
  const total = toNum(item.total);
  const avail = getAvail(item);
  return clamp(total - avail, 0, total);
}
// -----------------------------------------------------------------------------

function sortStockDescById(list: StockItem[]): StockItem[] {
  return [...list].sort((a, b) => {
    const ai = Number(a.id);
    const bi = Number(b.id);
    if (Number.isFinite(ai) && Number.isFinite(bi)) return bi - ai;
    return String(b.name).localeCompare(String(a.name), "uk");
  });
}

export default function AuditContainer(): React.JSX.Element {
  const { data: stockData } = useStockQuery();
  const [stock, setStock] = React.useState<StockItem[]>([]);
  /**
   * Тимчасові значення ВІДРЕДАГОВАНОГО total (за id рядка).
   * Ім'я ключа залишаємо як editingAvail для зворотної сумісності з існуючим UI,
   * але тепер тут зберігається саме total для рядка.
   */
  const [editingAvail, setEditingAvail] = React.useState<Record<number, number>>({});
  const [invOpen, setInvOpen] = React.useState(false);

  const [viewSnap, setViewSnap] = React.useState<Snapshot | null>(null);
  const [openAdd, setOpenAdd] = React.useState(false);

  const { data: snapsData, isLoading: _snapsLoading, error: snapsErrorObj } = useAuditsQuery();
  const snaps = snapsData ?? [];

  React.useEffect(() => {
    if (!stockData) return;
    setStock(sortStockDescById(stockData));
    setEditingAvail({});
  }, [stockData]);

  const qc = useQueryClient();
  const createMutation = useCreateAuditMutation();
  const upsertMutation = useUpsertStockMutation();

  // Підсумки (рахуємо від можливо зміненого total; issued фіксований як у даних)
  const sums = React.useMemo(() => {
    let sumTotal = 0;
    let sumAvailable = 0;
    for (const item of stock) {
      const originalTotal = toNum(item.total);
      const editedTotal = editingAvail[item.id];
      const totalForRow = typeof editedTotal === "number" ? Math.max(0, Math.trunc(editedTotal)) : originalTotal;
      sumTotal += totalForRow;

      const issued = getIssued(item as StockLike);
      const available = clamp(totalForRow - issued, 0, totalForRow);
      sumAvailable += available;
    }
    const sumIssued = sumTotal - sumAvailable;
    return { sumIssued, sumAvailable, sumTotal };
  }, [stock, editingAvail]);

  // уже додані види
  const existingKinds = React.useMemo<InventoryKindEnum[]>(() => {
    const acc = new Set<InventoryKindEnum>();
    for (const i of stock) {
      const mapped = (INVENTORY_UA_TO_EN as Record<string, InventoryKindEnum | undefined>)[i.name];
      if (mapped) acc.add(mapped);
    }
    return Array.from(acc);
  }, [stock]);

  // Зберегти ВІДРЕДАГОВАНИЙ TOTAL (як у createStockItem: upsert { kind, total })
  const saveTotal = React.useCallback(
    (id: number) => {
      const item = stock.find((i) => i.id === id) as StockLike | undefined;
      if (!item) return;

      const originalTotal = toNum(item.total);
      const edited = editingAvail[id];
      const nextTotal = typeof edited === "number" ? Math.max(0, Math.trunc(edited)) : originalTotal;

      const kindEnum = (INVENTORY_UA_TO_EN as Record<string, InventoryKindEnum | undefined>)[item.name];
      if (!kindEnum) {
        console.error("Не знайдено kind для:", item.name);
        return;
      }

      // Перерахунок available/issued від нового total (issued фіксуємо від беку)
      const issued = getIssued(item);
      const nextAvailable = clamp(nextTotal - issued, 0, nextTotal);

      // оптимістично оновлюємо total (+ узгоджуємо available)
      setStock((prev) => sortStockDescById(prev.map((i) => (i.id === id ? { ...i, total: nextTotal, available: nextAvailable } : i))));

      // бек очікує рівно { kind, total }
      upsertMutation.mutate(
        { kind: kindEnum, total: nextTotal },
        {
          onSuccess: () => {
            setEditingAvail(({ [id]: _omit, ...rest }) => rest);
          },
          onError: () => {
            void qc.invalidateQueries({ queryKey: stockKeys.all });
          },
        },
      );
    },
    [editingAvail, stock, upsertMutation, qc],
  );

  const createSnapshot = React.useCallback(
    async (date: string) => {
      const rows = stock.map((i) => {
        const originalTotal = toNum(i.total);
        const edited = editingAvail[i.id];
        const total = typeof edited === "number" ? Math.max(0, Math.trunc(edited)) : originalTotal;
        const issued = getIssued(i as StockLike);
        const available = clamp(total - issued, 0, total);
        return {
          name: i.name,
          issued,
          available,
          total,
        };
      });

      try {
        const created = await createMutation.mutateAsync({ date, rows });
        setViewSnap(created as Snapshot);
        setInvOpen(false);
      } catch (err) {
        console.error(err);
      }
    },
    [stock, editingAvail, createMutation],
  );

  const onViewById = React.useCallback(async (id: AuditId) => {
    try {
      const snap = await fetchAuditById(String(id));
      setViewSnap(snap as Snapshot);
    } catch (e) {
      console.error("[onViewById] failed:", e);
    }
  }, []);

  const [deletingIds, setDeletingIds] = React.useState<Set<AuditId>>(new Set());
  const isRowDeleting = React.useCallback((id: AuditId) => deletingIds.has(id), [deletingIds]);

  const onDeleteSnapshot = React.useCallback(
    async (id: AuditId) => {
      setDeletingIds((s) => new Set(s).add(id));
      try {
        await deleteAudit(String(id));
        setViewSnap((s) => (s && String(s.id) === String(id) ? null : s));
        await qc.invalidateQueries({ queryKey: ["audits"] });
      } catch (e) {
        console.error("[onDeleteSnapshot] failed:", e);
      } finally {
        setDeletingIds((s) => {
          const next = new Set(s);
          next.delete(id);
          return next;
        });
      }
    },
    [qc],
  );

  const snapsLoading = Boolean(_snapsLoading);
  const snapsError = snapsErrorObj instanceof Error ? snapsErrorObj.message : undefined;

  const handleExportSnapshot = React.useCallback(() => {
    if (!viewSnap) return;
    const normalized: Snapshot = {
      ...viewSnap,
      rows: viewSnap.rows.map((r) => ({
        ...r,
        name: isInventoryKind(r.name) ? labelInventoryKind(r.name) : r.name,
      })),
    };
    exportSnapshotToXLSX(normalized, `inventory_${viewSnap.date}.xlsx`);
  }, [viewSnap]);

  const handleCreatedStockItem = React.useCallback(async () => {
    setOpenAdd(false);
    await qc.invalidateQueries({ queryKey: stockKeys.all });
  }, [qc]);

  return (
    <>
      <AuditView
        stock={stock}
        editingAvail={editingAvail}
        sums={sums}
        snaps={snaps}
        invOpen={invOpen}
        viewSnap={viewSnap}
        today={today()}
        {...(snapsLoading ? { snapsLoading } : {})}
        {...(snapsError ? { snapsError } : {})}
        onOpenInventory={() => setInvOpen(true)}
        onCloseInventory={() => setInvOpen(false)}
        onCreateSnapshot={createSnapshot}
        onChangeTotal={(id, v) => setEditingAvail((e) => ({ ...e, [id]: v }))}
        onSaveAvail={saveTotal}
        onViewSnapshot={setViewSnap}
        onViewById={onViewById}
        onDeleteSnapshot={onDeleteSnapshot}
        onCloseSnapshot={() => setViewSnap(null)}
        onExportSnapshot={handleExportSnapshot}
        onOpenAddItem={() => setOpenAdd(true)}
        inventoryModalSubmitting={createMutation.isPending}
        isRowDeleting={isRowDeleting}
      />

      <AddStockItemModal open={openAdd} onClose={() => setOpenAdd(false)} onCreated={handleCreatedStockItem} existingKinds={existingKinds} />
    </>
  );
}
