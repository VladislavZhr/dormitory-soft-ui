// src/features/audit/ui/AuditView.tsx
"use client";

import * as React from "react";

import type { AuditViewProps } from "../model/types";

import AvailableEditor from "./auditComponents/AvailableEditor";
import InventoryTable from "./auditComponents/InventoryTable";
import SnapshotsTable from "./auditComponents/SnapshotsTable";
import InventoryModal from "./modals/InventoryModal";
import SnapshotViewModal from "./modals/SnapshotViewModal";

export default function AuditView(props: AuditViewProps) {
  const {
    // дані
    stock,
    editingAvail,
    sums,
    snaps,
    invOpen,
    viewSnap,
    today,

    // дії
    onOpenInventory,
    onCloseInventory,
    onCreateSnapshot,
    onChangeTotal,
    onSaveAvail,
    onViewSnapshot, // опційно: показ уже готового снапшоту
    onViewById, // опційно: GET за id (UUID)
    onDeleteSnapshot, // приймає UUID/рядок
    onCloseSnapshot,
    onExportSnapshot,
    onOpenAddItem,

    // стани
    snapsLoading,
    snapsError,
    inventoryModalSubmitting,
    snapshotDeleting,
    isRowDeleting,
  } = props;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8 border border-slate-200 bg-white shadow-sm rounded-2xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Склад та інвентаризація</h1>
          <div className="flex gap-2">
            <button onClick={onOpenAddItem} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Додати предмет
            </button>

            <button onClick={onOpenInventory} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Підрахувати залишки
            </button>
          </div>
        </div>

        {/* 2 колонки */}
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Ліва: поточний склад */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <InventoryTable stock={stock} sums={sums} editingAvail={editingAvail} onChangeTotal={onChangeTotal} onSaveAvail={onSaveAvail} AvailableEditor={AvailableEditor} normalizeNames />
          </div>

          {/* Права: історія */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <SnapshotsTable
              snaps={snaps}
              loading={Boolean(snapsLoading)}
              {...(snapsError ? { errorMessage: snapsError } : {})}
              // видалення/індикатор — працюємо з UUID як рядком
              onDelete={(id) => onDeleteSnapshot(String(id))}
              {...(isRowDeleting ? { isDeleting: (id) => isRowDeleting(String(id)) } : {})}
              // перегляд за id — передаємо UUID як є (рядком)
              {...(onViewById ? { onViewById: (id) => onViewById(String(id)) } : {})}
              // перегляд за готовим об’єктом
              {...(onViewSnapshot ? { onView: onViewSnapshot } : {})}
            />
          </div>
        </div>
      </div>

      {/* Модалка створення аудиту */}
      <InventoryModal open={invOpen} onClose={onCloseInventory} onConfirm={onCreateSnapshot} defaultDate={today} isSubmitting={!!inventoryModalSubmitting} />

      {/* Модалка перегляду конкретного аудиту:
          ДВА окремі JSX-варіанти (із onDelete і без) — щоб уникнути React static flag помилки */}
      {viewSnap && (
        <SnapshotViewModal
          key={`snap-${String(viewSnap.id)}`} // форс-ремонт при зміні знімка
          open
          snapshot={viewSnap}
          onClose={onCloseSnapshot}
          onExportClick={onExportSnapshot}
          onDelete={() => onDeleteSnapshot(String(viewSnap.id))}
          isDeleting={!!snapshotDeleting}
        />
      )}
    </main>
  );
}
