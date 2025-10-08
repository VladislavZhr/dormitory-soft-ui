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

// Толерантні схеми для /stock (легасі-форма з name/total/(issued|available))
const stockLegacyItemSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  name: z.string().min(1),
  total: z.coerce.number().int().nonnegative(),
  issued: z.coerce.number().int().nonnegative().optional(),
  available: z.coerce.number().int().nonnegative().optional(),
});
const stockLegacyListSchema = z.array(stockLegacyItemSchema);

// ── utils без any ────────────────────────────────────────────────────────────
function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
function toNum(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}
function firstIssueMessage(e: z.ZodError<unknown> | undefined): string {
  return e?.issues[0]?.message ?? "Invalid response shape";
}
function stableIdFromName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) {
    h = (h << 5) - h + name.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/inventory/stock
// Підтримує 2 форми бекенд-відповіді:
//  A) stockBackendListSchema: [{ kind: Enum, total, available? }]
//  B) stockLegacyListSchema:  [{ name, total, issued? (or available?) }]
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchStock(): Promise<StockItem[]> {
  try {
    const data = await httpJson<unknown>("/api/inventory/stock", { method: "GET" });

    // Варіант A: «бекенд-форма»
    const parsedA = stockBackendListSchema.safeParse(data);
    if (parsedA.success) {
      return toStockListUi(parsedA.data);
    }

    // Варіант B: «легасі-форма»
    const parsedB = stockLegacyListSchema.safeParse(data);
    if (parsedB.success) {
      const out: StockItem[] = parsedB.data.map((row) => {
        const total = toNum(row.total);
        const availRaw = row.available !== undefined ? toNum(row.available) : row.issued !== undefined ? total - toNum(row.issued) : 0;
        const available = clamp(availRaw, 0, total);

        const id = row.id ?? stableIdFromName(row.name);

        return {
          id,
          name: row.name,
          total,
          available,
        };
      });
      return out;
    }

    const err: ApiError = new Error("Некоректна відповідь сервера (stock)");
    err.status = 500;

    // коректно знімаємо повідомлення без any
    const msgA = !parsedA.success ? firstIssueMessage(parsedA.error) : undefined;
    const msgB = !parsedB.success ? firstIssueMessage(parsedB.error) : undefined;
    err.fieldErrors = { _root: msgA ?? msgB ?? "Invalid response shape" };
    throw err;
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
      err.fieldErrors = { _root: firstIssueMessage(parsed.error) };
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
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchAuditById(id: string): Promise<AuditItem> {
  const ok = auditUuidSchema.safeParse(id);
  if (!ok.success) {
    const apiErr: ApiError = new Error("Невірний ідентифікатор аудиту");
    apiErr.status = 400;
    apiErr.fieldErrors = { id: firstIssueMessage(ok.error) };
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
      err.fieldErrors = { _root: firstIssueMessage(parsed.error) };
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
      err.fieldErrors = { _root: firstIssueMessage(parsedOutput.error) };
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
    apiErr.fieldErrors = { id: firstIssueMessage(ok.error) };
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
      err.fieldErrors = { _root: firstIssueMessage(parsed.error) };
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
