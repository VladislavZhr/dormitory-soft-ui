// TypeScript strict
import { INVENTORY_EN_TO_UA } from "@/entities/student-inventory/model/mapper";
import { type InventoryKindEnum } from "@/entities/student-inventory/model/types";

import type { StockItem, AuditItem } from "../model/contracts";
import type { BackendStockItem, BackendStockList, BackendAuditsList, BackendAudit } from "../model/schema";

// утиліти
function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
function toNum(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}
function stableIdFromStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/**
 * Адаптація складу з бекенда до UI:
 * - name з enum → UA-мітка
 * - available: якщо нема — рахуємо як total - issued (issued може приїхати з іншої гілки бекенда)
 */
export function toStockListUi(list: BackendStockList | Array<Partial<BackendStockItem> & { kind?: InventoryKindEnum; name?: string; issued?: number }>): StockItem[] {
  return list.map((row) => {
    // джерела назви
    const name =
      (row as { name?: string }).name ??
      (() => {
        const k = (row as { kind?: InventoryKindEnum }).kind;
        return k ? (INVENTORY_EN_TO_UA[k] ?? String(k)) : "Невідомо";
      })();

    const total = toNum((row as { total?: number }).total ?? 0);

    // available може бути відсутнім → fallback на total - issued
    const issuedMaybe = toNum((row as { issued?: number }).issued ?? 0);
    const availRaw = (row as { available?: number }).available !== undefined ? toNum((row as { available?: number }).available) : total - issuedMaybe;

    const available = clamp(availRaw, 0, total);

    // id може бути відсутнім — стабілізуємо від назви
    const id = (row as { id?: number }).id ?? stableIdFromStr(name);

    const out: StockItem = {
      id,
      name,
      total,
      available,
    };
    return out;
  });
}

/* Нижче — заглушки-адаптери, лишаю як були, якщо вони вже реалізовані у тебе — не міняй */
export function auditListFromBackend(list: BackendAuditsList): AuditItem[] {
  // реалізація залежить від твоєї схеми; залиш як у тебе
  // тут нічого не змінював
  return list.map((a) => auditFromBackend(a));
}

export function auditFromBackend(a: BackendAudit): AuditItem {
  // реалізація залежить від твоєї схеми; залиш як у тебе
  // тут нічого не змінював
  const sumTotal = a.items.reduce((s, i) => s + toNum((i as { total?: number }).total ?? 0), 0);
  const sumAvailable = a.items.reduce((s, i) => s + toNum((i as { available?: number }).available ?? 0), 0);
  const sumIssued = sumTotal - sumAvailable;
  return {
    id: a.id,
    date: a.createdAt.slice(0, 10),
    sumIssued,
    sumAvailable,
    sumTotal,
    rows: a.items.map((i) => ({
      name: INVENTORY_EN_TO_UA[(i as { kind?: InventoryKindEnum }).kind as InventoryKindEnum] ?? "Невідомо",
      issued: toNum((i as { issued?: number }).issued ?? toNum((i as { total?: number }).total ?? 0) - toNum((i as { available?: number }).available ?? 0)),
      available: toNum((i as { available?: number }).available ?? 0),
      total: toNum((i as { total?: number }).total ?? 0),
    })),
  };
}
