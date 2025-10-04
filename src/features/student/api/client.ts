// src/features/student/api/client.ts
"use client";

import type { Student } from "@/entities/student/model/types";
import type { UpdateStudentRequest, UpdateStudentResponse, DeleteStudentResponse, StudentApiDto } from "@/features/student/model/contracts";
import { mapApiToStudent } from "@/features/student/model/mapper";
import { httpJson } from "@/shared/api/http";
import { API_ROUTES } from "@/shared/api/routes";

export async function getStudent(id: number | string): Promise<Student> {
  const url = API_ROUTES.students(String(id));
  const dto = await httpJson<StudentApiDto>(url, { method: "GET" });
  return mapApiToStudent(dto);
}

export async function updateStudent(id: number | string, data: UpdateStudentRequest) {
  const url = API_ROUTES.students(String(id));
  return httpJson<UpdateStudentResponse>(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteStudent(id: number | string) {
  const url = API_ROUTES.students(String(id));
  return httpJson<DeleteStudentResponse>(url, { method: "DELETE" });
}
