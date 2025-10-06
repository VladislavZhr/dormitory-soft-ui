// src/features/audit/api/hooks.ts
// TypeScript strict
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { AuditCreateReq, AuditItem, StockItem, AuditId } from "../model/contracts";

import { createAudit, deleteAudit, fetchAuditById, fetchAudits, fetchStock, upsertStock, type UpsertStockReq } from "./client";

// стабільні ключі
export const stockKeys = {
  all: ["inventory", "stock"] as const,
};
export const auditsKeys = {
  list: ["audits", "list"] as const,
  byId: (id: string) => ["audits", "detail", id] as const,
};

// єдиний сортер для складу (нові/оновлені — угорі)
// припущення: більші id = новіші; якщо ні — замініть на свою метрику
function sortStockDescById(list: StockItem[]): StockItem[] {
  return [...list].sort((a, b) => {
    const ai = Number(a.id);
    const bi = Number(b.id);
    if (Number.isFinite(ai) && Number.isFinite(bi)) return bi - ai;
    return String(b.name).localeCompare(String(a.name), "uk"); // fallback
  });
}

// GET /inventory/stock (ліва колонка) — трансформуємо кеш відразу
export function useStockQuery() {
  return useQuery<StockItem[]>({
    queryKey: stockKeys.all,
    queryFn: () => fetchStock(),
    select: (data) => sortStockDescById(data),
  });
}

// GET /inventories/audits — список аудитів (права колонка)
export function useAuditsQuery() {
  return useQuery<AuditItem[]>({
    queryKey: auditsKeys.list,
    queryFn: () => fetchAudits(),
  });
}

// GET /inventories/audits/{id}
export function useAuditByIdQuery(id: AuditId | null | undefined) {
  const sid = id == null ? undefined : String(id);
  const key = sid ? auditsKeys.byId(sid) : (["audits", "detail", "__disabled__"] as const);

  return useQuery<AuditItem>({
    queryKey: key,
    queryFn: () => fetchAuditById(sid!),
    enabled: Boolean(sid),
  });
}

// POST /inventories/audits — створення знімка
export function useCreateAuditMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: AuditCreateReq) => createAudit(payload),
    onSuccess: (created) => {
      void qc.invalidateQueries({ queryKey: auditsKeys.list });
      if (created?.id != null) {
        const sid = String(created.id);
        qc.setQueryData(auditsKeys.byId(sid), created);
      }
    },
  });
}

// DELETE /inventories/audits/{id}
export function useDeleteAuditMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: AuditId) => deleteAudit(String(id)),
    onSuccess: (_res, id) => {
      void qc.invalidateQueries({ queryKey: auditsKeys.list });
      const sid = String(id);
      qc.removeQueries({ queryKey: auditsKeys.byId(sid) });
    },
  });
}

// POST /inventory/stock — створити/оновити залишок
export function useUpsertStockMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpsertStockReq) => upsertStock(payload),
    onSuccess: async () => {
      // після збереження — перезбираємо кеш через select (нові/оновлені вгору)
      await qc.invalidateQueries({ queryKey: stockKeys.all });
    },
  });
}
