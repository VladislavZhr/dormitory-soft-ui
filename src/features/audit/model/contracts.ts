// TypeScript strict
import type { z } from "zod";

import { auditCreateSchema, snapshotSchema, snapshotRowSchema, auditsListSchema, auditIdSchema, stockItemResSchema, stockListResSchema } from "./schema";

/** UI-тип для лівої таблиці (після адаптації з backend.kind → name UA) */
export type StockItem = {
  id: number;
  name: string;
  total: number;
  available: number;
};

/** Публічні типи фічі (виведені з Zod) */
export type AuditId = z.infer<typeof auditIdSchema>; // === string (UUID)
export type AuditCreateReq = z.input<typeof auditCreateSchema>;
export type AuditItem = z.infer<typeof snapshotSchema>;
export type Snapshot = AuditItem;
export type SnapshotRow = z.infer<typeof snapshotRowSchema>;
export type AuditsList = z.infer<typeof auditsListSchema>;

/** DTO для отримання стокового предмету: рівно kind:string, total:number, available:number */
export type StockItemRes = z.infer<typeof stockItemResSchema>;
export type StockListRes = z.infer<typeof stockListResSchema>;
