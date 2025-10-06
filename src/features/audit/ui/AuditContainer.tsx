// src/features/audit/ui/AuditContainer.tsx
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
// Модалка розміщена у фічі inventory
import AddStockItemModal from "./modals/AddStockItemModal";

// локальний сортер для миттєвого відображення без очікування refetch
function sortStockDescById(list: StockItem[]): StockItem[] {
  return [...list].sort((a, b) => {
    const ai = Number(a.id);
    const bi = Number(b.id);
    if (Number.isFinite(ai) && Number.isFinite(bi)) return bi - ai;
    return String(b.name).localeCompare(String(a.name), "uk");
  });
}

export default function AuditContainer() {
  const { data: stockData } = useStockQuery();
  const [stock, setStock] = React.useState<StockItem[]>([]);
  const [editingAvail, setEditingAvail] = React.useState<Record<number, number>>({});
  const [invOpen, setInvOpen] = React.useState(false);

  const [viewSnap, setViewSnap] = React.useState<Snapshot | null>(null);
  const [openAdd, setOpenAdd] = React.useState(false);

  const { data: snapsData, isLoading: _snapsLoading, error: snapsErrorObj } = useAuditsQuery();
  const snaps = snapsData ?? [];

  React.useEffect(() => {
    if (!stockData) return;
    // дані з кешу вже відсортовані select'ом, але збережемо інваріант локально
    setStock(sortStockDescById(stockData));
    setEditingAvail({});
  }, [stockData]);

  const qc = useQueryClient();
  const createMutation = useCreateAuditMutation();
  const upsertMutation = useUpsertStockMutation();

  const sums = React.useMemo(() => {
    const sumIssued = stock.reduce((s, i) => s + i.issued, 0);
    const sumTotal = stock.reduce((s, i) => s + i.total, 0);
    const sumAvailable = sumTotal - sumIssued;
    return { sumIssued, sumAvailable, sumTotal };
  }, [stock]);

  // перелік уже доданих видів (для модалки додавання)
  const existingKinds = React.useMemo<InventoryKindEnum[]>(() => {
    const acc = new Set<InventoryKindEnum>();
    for (const i of stock) {
      const mapped = (INVENTORY_UA_TO_EN as Record<string, InventoryKindEnum | undefined>)[i.name];
      if (mapped) acc.add(mapped);
    }
    return Array.from(acc);
  }, [stock]);

  const saveAvailable = React.useCallback(
    (id: number) => {
      const item = stock.find((i) => i.id === id);
      if (!item) return;

      const currentAvailable = item.total - item.issued;
      const desiredAvailable = editingAvail[id] ?? currentAvailable;
      const safeAvail = Math.max(0, desiredAvailable);
      const newTotal = item.issued + safeAvail;

      const kindEnum = (INVENTORY_UA_TO_EN as Record<string, InventoryKindEnum | undefined>)[item.name];
      if (!kindEnum) {
        console.error("Не знайдено kind для:", item.name);
        return;
      }

      // оптимістично: оновлюємо елемент і миттєво сортуємо — оновлене угорі
      setStock((prev) => sortStockDescById(prev.map((i) => (i.id === id ? { ...i, total: newTotal } : i))));

      upsertMutation.mutate(
        { kind: kindEnum, total: newTotal },
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
      const rows = stock.map((i) => ({
        name: i.name,
        issued: i.issued,
        available: i.total - i.issued,
        total: i.total,
      }));

      try {
        const created = await createMutation.mutateAsync({ date, rows });
        setViewSnap(created as Snapshot);
        setInvOpen(false);
      } catch (err) {
        console.error(err);
      }
    },
    [stock, createMutation],
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
    // invalidate → useStockQuery.select відсортує, нове буде першим
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
        onChangeAvail={(id, v) => setEditingAvail((e) => ({ ...e, [id]: v }))}
        onSaveAvail={saveAvailable}
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
