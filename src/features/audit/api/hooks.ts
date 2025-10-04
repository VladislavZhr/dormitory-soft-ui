// src/features/audit/api/hooks.ts
// TypeScript strict
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { AuditCreateReq, AuditItem, StockItem, AuditId } from "../model/contracts";

import { createAudit, deleteAudit, fetchAuditById, fetchAudits, fetchStock } from "./client";

// ─────────────────────────────────────────────────────────────────────────────
// Стабільні ключі для кешу
// Для detail-ключа нормалізуємо id до string, щоб уникнути "1" vs 1 як різних ключів
export const stockKeys = {
  all: ["inventory", "stock"] as const,
};

export const auditsKeys = {
  list: ["audits", "list"] as const,
  byId: (id: string) => ["audits", "detail", id] as const,
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /inventory/stock — дані для InventoryTable (ліва колонка)
export function useStockQuery() {
  return useQuery<StockItem[]>({
    queryKey: stockKeys.all,
    queryFn: () => fetchStock(),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /inventories/audits — список аудитів (права колонка)
export function useAuditsQuery() {
  return useQuery<AuditItem[]>({
    queryKey: auditsKeys.list,
    queryFn: () => fetchAudits(),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /inventories/audits/{id} — перегляд конкретного аудиту
// Приймаємо AuditId (string | number), але всередині завжди приводимо до string
export function useAuditByIdQuery(id: AuditId | null | undefined) {
  const sid = id == null ? undefined : String(id);
  const key = sid ? auditsKeys.byId(sid) : (["audits", "detail", "__disabled__"] as const);

  return useQuery<AuditItem>({
    queryKey: key,
    queryFn: () => fetchAuditById(sid!), // бек очікує UUID у path → string
    enabled: Boolean(sid),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
/** POST /inventories/audits — створення знімка складу */
export function useCreateAuditMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: AuditCreateReq) => createAudit(payload),
    onSuccess: (created) => {
      // Оновлюємо список
      void qc.invalidateQueries({ queryKey: auditsKeys.list });

      // Проставляємо кеш detail, якщо API повернуло id
      if (created?.id != null) {
        const sid = String(created.id);
        qc.setQueryData(auditsKeys.byId(sid), created);
      }
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
/** DELETE /inventories/audits/{id} — видалення */
export function useDeleteAuditMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: AuditId) => deleteAudit(String(id)), // нормалізуємо до string
    onSuccess: (_res, id) => {
      // Оновлюємо список
      void qc.invalidateQueries({ queryKey: auditsKeys.list });
      // Зносимо кеш detail (за нормалізованим ключем)
      const sid = String(id);
      qc.removeQueries({ queryKey: auditsKeys.byId(sid) });
    },
  });
}
