// TypeScript strict
import { z } from "zod";

import { InventoryKindEnum } from "@/entities/student-inventory/model/types";

/* ── Спільний тип/схема айді АУДИТУ ────────────────────────────────────────
   Бекенд очікує UUID у шляху → у UI всюди тримаємо string UUID.
*/
export const auditIdSchema = z.string().uuid();

/* ── UI-схеми (те, що споживає інтерфейс) ────────────────────────────────── */
export const snapshotRowSchema = z.object({
  name: z.string().min(1, "Назва обовʼязкова"),
  issued: z.number().int(),
  available: z.number().int(),
  total: z.number().int(),
});

export const snapshotSchema = z.object({
  id: auditIdSchema, // UUID string
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Очікується YYYY-MM-DD"),
  sumIssued: z.number().int(),
  sumAvailable: z.number().int(),
  sumTotal: z.number().int(),
  rows: z.array(snapshotRowSchema).min(1, "Порожній аудит не допускається"),
});

export const auditsListSchema = z.array(snapshotSchema);

export const auditCreateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Очікується YYYY-MM-DD"),
  rows: z
    .array(
      z.object({
        name: snapshotRowSchema.shape.name,
        issued: snapshotRowSchema.shape.issued,
        available: snapshotRowSchema.shape.available,
        total: snapshotRowSchema.shape.total,
      }),
    )
    .min(1, "Додайте принаймні один рядок"),
});

/* ── Backend-схеми для списку аудитів ────────────────────────────────────── */
export const backendAuditItemSchema = z.object({
  id: z.string().uuid(),
  kind: z.nativeEnum(InventoryKindEnum),
  total: z.coerce.number().int(),
  issued: z.coerce.number().int(),
  available: z.coerce.number().int(),
});

export const backendAuditSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  items: z.array(backendAuditItemSchema).min(1),
});

export const backendAuditsListSchema = z.array(backendAuditSchema);
export type BackendAudit = z.infer<typeof backendAuditSchema>;
export type BackendAuditsList = z.infer<typeof backendAuditsListSchema>;

/* ── Backend stock (kind) ─────────────────────────────────────────────────── */
export const stockBackendItemSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  kind: z.nativeEnum(InventoryKindEnum),
  total: z.coerce.number().int(),
  available: z.coerce.number().int().optional(),
});
export const stockBackendListSchema = z.array(stockBackendItemSchema);
export type BackendStockItem = z.infer<typeof stockBackendItemSchema>;
export type BackendStockList = z.infer<typeof stockBackendListSchema>;

/* ── Створення предмета складу ────────────────────────────────────────────── */
export const addStockItemReqSchema = z.object({
  kind: z.nativeEnum(InventoryKindEnum),
  total: z.number().int(),
});
export const addStockItemResSchema = z.union([
  z.object({ message: z.string() }),
  z.object({
    id: z.number().int().positive().optional(),
    kind: z.nativeEnum(InventoryKindEnum).optional(),
    total: z.number().int().optional(),
    available: z.number().int().optional(),
  }),
]);
export type CreateStockItemReq = z.infer<typeof addStockItemReqSchema>;

export const stockItemResSchema = z.object({
  kind: z.string().min(1),
  total: z.coerce.number().int().nonnegative(),
  available: z.coerce.number().int().nonnegative(),
});
export const stockListResSchema = z.array(stockItemResSchema);
