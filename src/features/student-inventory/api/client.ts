// без 'use client' — можна юзати і на сервері при потребі
import type { StudentInventoryItem } from "@/entities/student-inventory/model/types";
import { httpJson } from "@/shared/api/http";
import { API_ROUTES } from "@/shared/api/routes";

import type { StudentInventoryDto, IssueRequestDto, IssueResponseDto, ReturnRequestDto, ReturnResponseDto } from "../model/contracts";
import { mapDtoToItem } from "../model/mappers";

// ─── Активні айтеми ────────────────────────────────────────────────
export async function listStudentItems(studentId: number | string): Promise<StudentInventoryItem[]> {
  const url = API_ROUTES.inventory.studentItems(studentId);
  const arr = await httpJson<StudentInventoryDto[]>(url, { method: "GET" });
  return arr.map(mapDtoToItem);
}

// ─── Видача ────────────────────────────────────────────────────────
export async function issueItem(dto: IssueRequestDto): Promise<StudentInventoryItem> {
  const url = API_ROUTES.inventory.issue;
  const res = await httpJson<IssueResponseDto>(url, {
    method: "POST",
    body: JSON.stringify(dto),
  });
  return mapDtoToItem(res);
}

// ─── Повернення ────────────────────────────────────────────────────
// повертаємо або { closed: true }, або StudentInventoryItem
// features/student-inventory/api/client.ts
export async function returnItem(dto: ReturnRequestDto): Promise<StudentInventoryItem | { closed: true }> {
  const url = API_ROUTES.inventory.return;
  // може повернути null (наш патч httpJson) на 204
  const res = await httpJson<ReturnResponseDto | null>(url, {
    method: "POST",
    body: JSON.stringify(dto),
  });

  if (res === null) return { closed: true } as const; // 204/empty
  if ("closed" in res && res.closed) return { closed: true } as const; // явний флаг
  return mapDtoToItem(res as StudentInventoryDto); // часткове
}
