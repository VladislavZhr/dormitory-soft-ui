// TypeScript strict

export type Sums = { sumIssued: number; sumAvailable: number; sumTotal: number };

import { InventoryKindEnum } from "@/entities/student-inventory/model/types";

import type { AuditItem, Snapshot, StockItem, AuditId } from "./contracts";

/* ── Таблиця історії ─────────────────────────────────────────────────────── */
export type SnapshotsTableProps = {
  snaps: AuditItem[];
  onView?: (s: AuditItem) => void; // опційно: передати об'єкт повністю
  onViewById?: (id: AuditId) => void; // UUID string
  onDelete: (id: AuditId) => void; // UUID string
  loading?: boolean;
  errorMessage?: string;
  isDeleting?: (id: AuditId) => boolean; // UUID string
};

/* ── Модалка вибору дати для створення аудиту ────────────────────────────── */
export type InventoryModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (date: string) => void;
  defaultDate?: string;
  isSubmitting?: boolean;
};

/* ── Модалка перегляду конкретного аудиту ────────────────────────────────── */
export type SnapshotViewModalProps = {
  open: boolean;
  snapshot: Snapshot | null;
  onClose: () => void;
  onExportClick: () => void;
  onDelete?: (() => void) | undefined; // ← важливо
  isDeleting?: boolean;
};

/* ── Основний вʼю ────────────────────────────────────────────────────────── */
export type AuditViewProps = {
  stock: StockItem[];
  editingAvail: Record<number, number>;
  sums: { sumIssued: number; sumAvailable: number; sumTotal: number };
  snaps: AuditItem[];
  invOpen: boolean;
  viewSnap: Snapshot | null;
  today: string;

  // дії
  onOpenInventory: () => void;
  onCloseInventory: () => void;
  onCreateSnapshot: (date: string) => void | Promise<void>;
  onChangeTotal: (id: number, v: number) => void;
  onSaveAvail: (id: number) => void;
  onViewSnapshot?: (s: Snapshot) => void; // старий шлях
  onViewById?: (id: AuditId) => void; // UUID string
  onDeleteSnapshot: (id: AuditId) => void; // UUID string
  onCloseSnapshot: () => void;
  onExportSnapshot: () => void;
  onOpenAddItem?: () => void;

  // стани
  snapsLoading?: boolean;
  snapsError?: string;
  inventoryModalSubmitting?: boolean;
  snapshotDeleting?: boolean;
  isRowDeleting?: (id: AuditId) => boolean; // UUID string
};

/* ── Ліва таблиця складу ─────────────────────────────────────────────────── */
export type InventoryTableProps = {
  stock: StockItem[];
  sums: { sumIssued: number; sumAvailable: number; sumTotal: number };
  editingAvail: Record<number, number>;
  onChangeAvail: (id: number, v: number) => void;
  onSaveAvail: (id: number) => void;
  AvailableEditor: (p: { value: number; onChange: (v: number) => void; onSave: () => void }) => React.JSX.Element;
  normalizeNames?: boolean;
};

/* ── Модалка додавання предмета ──────────────────────────────────────────── */
export type AddStockItemModalProps = {
  open: boolean;
  onClose: () => void;
  endpoint?: string;
  onCreated?: () => void | Promise<void>;
  existingKinds?: InventoryKindEnum[];
};
