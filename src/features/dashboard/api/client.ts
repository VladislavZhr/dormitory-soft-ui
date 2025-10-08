// TypeScript strict

import type { Student } from "@/entities/student/model/types";
import { httpJson } from "@/shared/api/http";

import type { CreateStudentRequest } from "../model/schema";
import { dashboardAsArraySchema } from "../model/schema";
import { importResultSchema } from "../model/schema";
import { addStudentResponseSchema } from "../model/schema";

/**
 * Внутрішні API-ендпоїнти (proxy через /app/api/...).
 */
const API = {
  DASHBOARD: "/api/students/get-all", // GET з query params
  ADD: "/api/students/add", // POST JSON
  IMPORT: "/api/students/import", // POST multipart/form-data
  EXPORT_ASSIGNED_XLSX: "/api/inventory/export/assigned.xlsx", // GET -> Blob
} as const;

export async function getAllStudents(
  params: {
    fullName?: string | null;
    roomNumber?: string | null;
    faculty?: string | null;
    studyGroup?: string | null;
    page?: number;
    pageSize?: number;
  } = {},
  signal?: AbortSignal | null,
): Promise<Student[]> {
  const sp = new URLSearchParams();
  if (params.fullName) sp.set("fullName", params.fullName);
  if (params.roomNumber) sp.set("roomNumber", params.roomNumber);
  if (params.faculty) sp.set("faculty", params.faculty);
  if (params.studyGroup) sp.set("studyGroup", params.studyGroup);
  if (params.page) sp.set("page", String(params.page));
  if (params.pageSize) sp.set("pageSize", String(params.pageSize));

  const url = sp.toString() ? `${API.DASHBOARD}?${sp}` : API.DASHBOARD;

  const data = await httpJson<unknown>(url, {
    method: "GET",
    signal: signal ?? null, // exactOptionalPropertyTypes-friendly
  });

  const parsed = dashboardAsArraySchema.safeParse(data);
  console.log(parsed);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const where = issue?.path?.length ? issue.path.join(".") : "root";
    throw new Error(`Invalid dashboard payload at ${where}: ${issue?.message}`);
  }
  return parsed.data; // <-- Student[]
}

/**
 * POST /api/students/add — додати студента.
 */
export async function addStudent(payload: CreateStudentRequest, signal?: AbortSignal | null): Promise<Student> {
  const data = await httpJson<unknown>(API.ADD, {
    method: "POST",
    body: JSON.stringify(payload),
    signal: signal ?? null,
  });

  const parsed = addStudentResponseSchema.safeParse(data);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const where = issue?.path?.length ? issue.path.join(".") : "root";
    throw new Error(`Invalid student payload received from API at ${where}: ${issue?.message}`);
  }
  return parsed.data;
}

/**
 * POST /api/students/import — імпорт Excel/CSV.
 * Для multipart НЕ виставляємо Content-Type вручну.
 */
export async function importStudents(file: File, signal?: AbortSignal | null): Promise<{ imported: number }> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(API.IMPORT, {
    method: "POST",
    body: form,
    credentials: "include",
    cache: "no-store",
    signal: signal ?? null,
  });

  if (!res.ok) {
    throw new Error(`Import failed with status ${res.status}`);
  }

  const json = (await res.json()) as unknown;
  const parsed = importResultSchema.safeParse(json);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const where = issue?.path?.length ? issue.path.join(".") : "root";
    throw new Error(`Invalid import result payload received from API at ${where}: ${issue?.message}`);
  }
  return parsed.data;
}

/**
 * GET /api/inventory/export/assigned.xlsx — отримати XLSX як Blob (без автозавантаження).
 * Використовуй у місцях, де потрібен саме Blob (наприклад, для попередньої перевірки/стрімінгу).
 */
export async function fetchAssignedXlsx(signal?: AbortSignal | null): Promise<Blob> {
  const res = await fetch(API.EXPORT_ASSIGNED_XLSX, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    signal: signal ?? null,
  });

  if (!res.ok) {
    // Спробуємо витягнути повідомлення помилки, якщо це JSON
    let detail = "";
    try {
      const j = (await res.clone().json()) as unknown;
      // @ts-expect-error – best-effort читання message
      detail = typeof j?.message === "string" ? ` — ${j.message}` : "";
    } catch {
      // ignore: не JSON
    }
    throw new Error(`Export failed with status ${res.status}${detail}`);
  }

  return res.blob();
}

/**
 * Хелпер: одразу завантажує файл у браузері (створює посилання на Blob і клікає його).
 * Якщо бек виставляє Content-Disposition — для CORS потрібен Access-Control-Expose-Headers,
 * і тоді краще проксувати через /app/api/... щоб дістати ім'я файлу на сервері.
 */
export async function downloadAssignedXlsx(opts?: { fileName?: string; signal?: AbortSignal | null }): Promise<void> {
  const blob = await fetchAssignedXlsx(opts?.signal ?? null);

  if (typeof window === "undefined") {
    // На сервері зберігати файл неможливо
    return;
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = opts?.fileName ?? "assigned.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
