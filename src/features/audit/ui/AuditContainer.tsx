// src/features/audit/ui/AuditContainer.tsx
"use client";

import { useQueryClient } from "@tanstack/react-query";
import * as React from "react";

import { labelInventoryKind } from "@/entities/student-inventory/model/mapper";
import { isInventoryKind } from "@/entities/student-inventory/model/types";

import { fetchAuditById, deleteAudit } from "../api/client";
import { useAuditsQuery, useCreateAuditMutation, useStockQuery, stockKeys } from "../api/hooks";
import { exportSnapshotToXLSX } from "../lib/exportXlsx";
import { today } from "../lib/today";
import type { StockItem, Snapshot, AuditId } from "../model/contracts";

import AuditView from "./AuditView";
import AddStockItemModal from "./modals/AddStockItemModal";

export default function AuditContainer() {
  // Ліва таблиця (поточний склад)
  const { data: stockData } = useStockQuery();
  const [stock, setStock] = React.useState<StockItem[]>([]);
  const [editingAvail, setEditingAvail] = React.useState<Record<number, number>>({});
  const [invOpen, setInvOpen] = React.useState(false);

  // Перегляд конкретного снапшоту
  const [viewSnap, setViewSnap] = React.useState<Snapshot | null>(null);

  // Модалка додавання предмета
  const [openAdd, setOpenAdd] = React.useState(false);

  // Права таблиця (історія аудитів)
  const { data: snapsData, isLoading: _snapsLoading, error: snapsErrorObj } = useAuditsQuery();
  const snaps = snapsData ?? [];

  React.useEffect(() => {
    if (!stockData) return;
    setStock(stockData);
    setEditingAvail({});
  }, [stockData]);

  const qc = useQueryClient();

  // Мутація створення аудиту
  const createMutation = useCreateAuditMutation();

  // Підсумки для лівої таблиці
  const sums = React.useMemo(() => {
    const sumIssued = stock.reduce((s, i) => s + i.issued, 0);
    const sumTotal = stock.reduce((s, i) => s + i.total, 0);
    const sumAvailable = sumTotal - sumIssued;
    return { sumIssued, sumAvailable, sumTotal };
  }, [stock]);

  // Зберегти відредаговане "Доступно"
  const saveAvailable = React.useCallback(
    (id: number) => {
      setStock((prev) =>
        prev.map((i) => {
          if (i.id !== id) return i;
          const available = i.total - i.issued;
          const nextAvail = editingAvail[id] ?? available;
          return { ...i, total: i.issued + Math.max(0, nextAvail) };
        }),
      );
      setEditingAvail(({ [id]: _omit, ...rest }) => rest);
    },
    [editingAvail],
  );

  // Створення аудиту
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

  // Перегляд аудиту за id (мережевий запит)
  const onViewById = React.useCallback(async (id: AuditId) => {
    try {
      const snap = await fetchAuditById(String(id));
      setViewSnap(snap as Snapshot);
    } catch (e) {
      console.error("[onViewById] failed:", e);
      // TODO: toast
    }
  }, []);

  // Видалення аудиту (мережевий запит) + індикатор рядка
  const [deletingIds, setDeletingIds] = React.useState<Set<AuditId>>(new Set());
  const isRowDeleting = React.useCallback((id: AuditId) => deletingIds.has(id), [deletingIds]);

  const onDeleteSnapshot = React.useCallback(
    async (id: AuditId) => {
      // (без confirm) — власні модалки/тости можна додати у SnapshotViewModal або тут
      setDeletingIds((s) => new Set(s).add(id));
      try {
        await deleteAudit(String(id));

        // якщо відкритий саме цей снапшот — закриваємо модалку
        setViewSnap((s) => (s && String(s.id) === String(id) ? null : s));

        // оновлюємо список аудитів
        await qc.invalidateQueries({ queryKey: ["audits"] });
      } catch (e) {
        console.error("[onDeleteSnapshot] failed:", e);
        // TODO: toast
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

  // Точна підтримка exactOptionalPropertyTypes
  const snapsLoading = Boolean(_snapsLoading);
  const snapsError = snapsErrorObj instanceof Error ? snapsErrorObj.message : undefined;

  // Експорт XLSX з локалізованими назвами (EN→UA для відомих ключів)
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

  // Коли створили новий предмет — інвалідовуємо кеш складу
  const handleCreatedStockItem = React.useCallback(async () => {
    setOpenAdd(false);
    await qc.invalidateQueries({ queryKey: stockKeys.all });
  }, [qc]);

  return (
    <>
      <AuditView
        // дані
        stock={stock}
        editingAvail={editingAvail}
        sums={sums}
        snaps={snaps}
        invOpen={invOpen}
        viewSnap={viewSnap}
        today={today()}
        // опційні стани правої колонки — не передаємо undefined
        {...(snapsLoading ? { snapsLoading } : {})}
        {...(snapsError ? { snapsError } : {})}
        // дії
        onOpenInventory={() => setInvOpen(true)}
        onCloseInventory={() => setInvOpen(false)}
        onCreateSnapshot={createSnapshot}
        onChangeAvail={(id, v) => setEditingAvail((e) => ({ ...e, [id]: v }))}
        onSaveAvail={saveAvailable}
        onViewSnapshot={setViewSnap} // залишено для сумісності
        onViewById={onViewById} // перегляд по UUID
        onDeleteSnapshot={onDeleteSnapshot}
        onCloseSnapshot={() => setViewSnap(null)}
        onExportSnapshot={handleExportSnapshot}
        onOpenAddItem={() => setOpenAdd(true)}
        inventoryModalSubmitting={createMutation.isPending}
        isRowDeleting={isRowDeleting}
      />

      {/* Модалка додавання предмета живе у контейнері, щоб інвалідувати кеш */}
      <AddStockItemModal open={openAdd} onClose={() => setOpenAdd(false)} onCreated={handleCreatedStockItem} />
    </>
  );
}
