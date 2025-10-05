// src/features/audit/lib/adapters.ts
// TypeScript strict

import { labelInventoryKind } from "@/entities/student-inventory/model/mapper";
import type { InventoryKindEnum } from "@/entities/student-inventory/model/types";

import type { StockItem, AuditItem } from "../model/contracts";
import type { BackendStockItem, BackendAudit, BackendAuditsList } from "../model/schema";

/* ───────────────────────── helpers ───────────────────────── */

function stableIdFromKind(kind: string): number {
  // детермінований позитивний int для локального id (лише для складу)
  let h = 0;
  for (let i = 0; i < kind.length; i++) h = (h * 31 + kind.charCodeAt(i)) | 0;
  const v = Math.abs(h);
  return v === 0 ? 1 : v;
}

function isoToYMD(iso: string): string {
  // "2025-09-12T21:47:10.123Z" -> "2025-09-12"
  const d = new Date(iso);
  return Number.isNaN(d.valueOf()) ? iso : d.toISOString().slice(0, 10);
}

/* ───────────────────────── stock adapters ───────────────────────── */

export function toStockListUi(rows: BackendStockItem[]): StockItem[] {
  return rows.map((row) => ({
    id: row.id ?? stableIdFromKind(row.kind),
    name: labelInventoryKind(row.kind as InventoryKindEnum), // EN → UA
    total: row.total,
    issued: row.issued ?? 0,
  }));
}

export function toStockItemUi(row: BackendStockItem): StockItem {
  return {
    id: row.id ?? stableIdFromKind(row.kind),
    name: labelInventoryKind(row.kind as InventoryKindEnum),
    total: row.total,
    issued: row.issued ?? 0,
  };
}

/* ───────────────────────── audit adapters ─────────────────────────
   Бекенд:
   {
     id: "uuid",
     createdAt: "ISO",
     items: [{ id:"uuid", kind:"blanket", total:120, issued:37, available:83 }]
   }

   UI (AuditItem) тепер має id: string | number (AuditId),
   тож просто ПЕРЕДАЄМО id ЯК Є, без конвертації у number.
------------------------------------------------------------------- */

export function auditFromBackend(a: BackendAudit): AuditItem {
  const date = isoToYMD(a.createdAt);

  const rows = a.items.map((it) => {
    const avail = typeof it.available === "number" ? it.available : it.total - it.issued;
    return {
      name: labelInventoryKind(it.kind as InventoryKindEnum),
      issued: it.issued,
      available: avail,
      total: it.total,
    };
  });

  const sumIssued = rows.reduce((s, r) => s + r.issued, 0);
  const sumTotal = rows.reduce((s, r) => s + r.total, 0);
  const sumAvailable = rows.reduce((s, r) => s + r.available, 0);

  return {
    id: a.id, // ← зберігаємо UUID як string (без Number(...))
    date,
    sumIssued,
    sumAvailable,
    sumTotal,
    rows,
  };
}

export function auditListFromBackend(list: BackendAuditsList): AuditItem[] {
  return list.map(auditFromBackend);
}
