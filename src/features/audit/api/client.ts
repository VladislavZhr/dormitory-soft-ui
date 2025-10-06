// TypeScript strict

import { z } from "zod";

import { httpJson, HttpError } from "@/shared/api/http";

import { toStockListUi, auditListFromBackend, auditFromBackend } from "../lib/adapters";
import type { AuditCreateReq, AuditItem, StockItem } from "../model/contracts";
import { addStockItemReqSchema, addStockItemResSchema, auditCreateSchema, stockBackendListSchema, backendAuditsListSchema, backendAuditSchema, type CreateStockItemReq } from "../model/schema";

// ── Тип помилки під mapError/RHF ─────────────────────────────────────────────
export type ApiError = Error & {
  status?: number;
  fieldErrors?: Record<string, string>;
};

// ── Локальні схеми (дрібні) ──────────────────────────────────────────────────
const auditUuidSchema = z.string().uuid(); // очікуємо UUID від бекенда
const deleteResSchema = z.object({ message: z.string() });

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/inventory/stock
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchStock(): Promise<StockItem[]> {
  try {
    const data = await httpJson<unknown>("/api/inventory/stock", { method: "GET" });

    const parsed = stockBackendListSchema.safeParse(data);
    if (!parsed.success) {
      const err: ApiError = new Error("Некоректна відповідь сервера (stock)");
      err.status = 500;
      err.fieldErrors = { _root: parsed.error.issues[0]?.message ?? "Invalid response shape" };
      throw err;
    }
    return toStockListUi(parsed.data);
  } catch (e: unknown) {
    if (e instanceof HttpError) {
      const apiErr: ApiError = new Error(e.message);
      apiErr.status = e.status;
      const body = e.body;
      if (body && typeof body === "object" && "fieldErrors" in body) {
        const fe = (body as { fieldErrors?: Record<string, string> | undefined }).fieldErrors;
        if (fe !== undefined) apiErr.fieldErrors = fe;
      }
      throw apiErr;
    }
    const apiErr: ApiError = new Error("Мережна помилка. Перевірте з’єднання.");
    apiErr.status = 0;
    throw apiErr;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/inventories/audits  (список, backend shape -> UI)
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchAudits(): Promise<AuditItem[]> {
  try {
    const data = await httpJson<unknown>("/api/inventories/audits", { method: "GET" });
    const parsed = backendAuditsListSchema.safeParse(data);
    if (!parsed.success) {
      const err: ApiError = new Error("Некоректна відповідь сервера (audits list)");
      err.status = 500;
      err.fieldErrors = { _root: parsed.error.issues[0]?.message ?? "Invalid response shape" };
      throw err;
    }
    return auditListFromBackend(parsed.data);
  } catch (e: unknown) {
    if (e instanceof HttpError) {
      const apiErr: ApiError = new Error(e.message);
      apiErr.status = e.status;
      const body = e.body;
      if (body && typeof body === "object" && "fieldErrors" in body) {
        const fe = (body as { fieldErrors?: Record<string, string> | undefined }).fieldErrors;
        if (fe !== undefined) apiErr.fieldErrors = fe;
      }
      throw apiErr;
    }
    const apiErr: ApiError = new Error("Мережна помилка. Перевірте з’єднання.");
    apiErr.status = 0;
    throw apiErr;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/inventories/audits/{id}  (один аудит, backend shape -> UI)
// id: string (UUID) — обовʼязково
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchAuditById(id: string): Promise<AuditItem> {
  const ok = auditUuidSchema.safeParse(id);
  if (!ok.success) {
    const apiErr: ApiError = new Error("Невірний ідентифікатор аудиту");
    apiErr.status = 400;
    apiErr.fieldErrors = { id: ok.error.issues[0]?.message ?? "Invalid id" };
    throw apiErr;
  }

  try {
    const data = await httpJson<unknown>(`/api/inventories/audits/${encodeURIComponent(id)}`, {
      method: "GET",
    });

    const parsed = backendAuditSchema.safeParse(data);
    if (!parsed.success) {
      const err: ApiError = new Error("Некоректна відповідь сервера (audit by id)");
      err.status = 500;
      err.fieldErrors = { _root: parsed.error.issues[0]?.message ?? "Invalid response shape" };
      throw err;
    }
    return auditFromBackend(parsed.data);
  } catch (e: unknown) {
    if (e instanceof HttpError) {
      const apiErr: ApiError = new Error(e.message);
      apiErr.status = e.status;
      const body = e.body;
      if (body && typeof body === "object" && "fieldErrors" in body) {
        const fe = (body as { fieldErrors?: Record<string, string> | undefined }).fieldErrors;
        if (fe !== undefined) apiErr.fieldErrors = fe;
      }
      throw apiErr;
    }
    const apiErr: ApiError = new Error("Мережна помилка. Перевірте з’єднання.");
    apiErr.status = 0;
    throw apiErr;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/inventories/audits  (створення; backend shape -> UI)
// ─────────────────────────────────────────────────────────────────────────────
export async function createAudit(payload: AuditCreateReq): Promise<AuditItem> {
  // 1) локальна валідація інпуту (UI shape)
  const parsedInput = auditCreateSchema.safeParse(payload);
  if (!parsedInput.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsedInput.error.issues) {
      const path = issue.path.join(".") || "_root";
      if (!fieldErrors[path]) fieldErrors[path] = issue.message;
    }
    const apiErr: ApiError = new Error("Помилка валідації");
    apiErr.status = 400;
    apiErr.fieldErrors = fieldErrors;
    throw apiErr;
  }

  // 2) запит
  try {
    const created = await httpJson<unknown>("/api/inventories/audits", {
      method: "POST",
      body: JSON.stringify(parsedInput.data),
    });

    // 3) валідація бекенд-форми та адаптація до UI
    const parsedOutput = backendAuditSchema.safeParse(created);
    if (!parsedOutput.success) {
      const err: ApiError = new Error("Некоректна відповідь сервера після створення аудиту");
      err.status = 500;
      err.fieldErrors = { _root: parsedOutput.error.issues[0]?.message ?? "Invalid response shape" };
      throw err;
    }
    return auditFromBackend(parsedOutput.data);
  } catch (e: unknown) {
    if (e instanceof HttpError) {
      const apiErr: ApiError = new Error(e.message);
      apiErr.status = e.status;
      const body = e.body;
      if (body && typeof body === "object" && "fieldErrors" in body) {
        const fe = (body as { fieldErrors?: Record<string, string> | undefined }).fieldErrors;
        if (fe !== undefined) apiErr.fieldErrors = fe;
      }
      throw apiErr;
    }
    const apiErr: ApiError = new Error("Мережна помилка. Перевірте з’єднання.");
    apiErr.status = 0;
    throw apiErr;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
/** DELETE /api/inventories/audits/{id} (UUID) */
// ─────────────────────────────────────────────────────────────────────────────
export async function deleteAudit(id: string): Promise<{ message: string }> {
  const ok = auditUuidSchema.safeParse(id);
  if (!ok.success) {
    const apiErr: ApiError = new Error("Невірний ідентифікатор аудиту");
    apiErr.status = 400;
    apiErr.fieldErrors = { id: ok.error.issues[0]?.message ?? "Invalid id" };
    throw apiErr;
  }

  try {
    const res = await httpJson<unknown>(`/api/inventories/audits/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    const parsed = deleteResSchema.safeParse(res);
    if (!parsed.success) {
      const err: ApiError = new Error("Некоректна відповідь сервера після видалення");
      err.status = 500;
      err.fieldErrors = { _root: parsed.error.issues[0]?.message ?? "Invalid response shape" };
      throw err;
    }
    return parsed.data;
  } catch (e: unknown) {
    if (e instanceof HttpError) {
      const apiErr: ApiError = new Error(e.message);
      apiErr.status = e.status;
      const body = e.body;
      if (body && typeof body === "object" && "fieldErrors" in body) {
        const fe = (body as { fieldErrors?: Record<string, string> | undefined }).fieldErrors;
        if (fe !== undefined) apiErr.fieldErrors = fe;
      }
      throw apiErr;
    }
    const apiErr: ApiError = new Error("Мережна помилка. Перевірте з’єднання.");
    apiErr.status = 0;
    throw apiErr;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/inventory/stock  (створення предмета)
// ─────────────────────────────────────────────────────────────────────────────
export async function createStockItem(payload: CreateStockItemReq): Promise<void> {
  // 1) локальна валідація
  const ok = addStockItemReqSchema.safeParse(payload);
  if (!ok.success) {
    const apiErr: ApiError = new Error("Помилка валідації");
    apiErr.status = 400;
    apiErr.fieldErrors = Object.fromEntries(ok.error.issues.map((i) => [i.path.join(".") || "_root", i.message]));
    throw apiErr;
  }

  // 2) запит
  try {
    const res = await httpJson<unknown>("/api/inventory/stock", {
      method: "POST",
      body: JSON.stringify(ok.data),
    });

    // 3) (опційно) звіряємо форму відповіді, але не завалюємо, якщо інша
    const parsed = addStockItemResSchema.safeParse(res);
    if (!parsed.success) {
      // console.warn("Unexpected createStockItem response shape", res);
    }
    return;
  } catch (e: unknown) {
    if (e instanceof HttpError) {
      const apiErr: ApiError = new Error(e.message);
      apiErr.status = e.status;
      const body = e.body;
      if (body && typeof body === "object" && "fieldErrors" in body) {
        const fe = (body as { fieldErrors?: Record<string, string> | undefined }).fieldErrors;
        if (fe !== undefined) apiErr.fieldErrors = fe;
      }
      throw apiErr;
    }
    const apiErr: ApiError = new Error("Мережна помилка. Перевірте з’єднання.");
    apiErr.status = 0;
    throw apiErr;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/inventory/stock  (upsert: створити/оновити залишок)
// Використовуйте це в UI для кнопки "Зберегти".
// ─────────────────────────────────────────────────────────────────────────────
export type UpsertStockReq = CreateStockItemReq; // { kind: string; total: number }
export async function upsertStock(payload: UpsertStockReq): Promise<void> {
  return createStockItem(payload);
}
