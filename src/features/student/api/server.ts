// server-only API: використовується з SSR/Server Components
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";

import type { Student } from "@/entities/student/model/types";
import { ACCESS_TOKEN_KEY } from "@/features/auth/login/model/constants";
import type { StudentApiDto } from "@/features/student/model/contracts";
import { mapApiToStudent } from "@/features/student/model/mapper";
import { httpJson, HttpError } from "@/shared/api/http";
import { API_ROUTES } from "@/shared/api/routes";

export async function getStudentServer(id: string): Promise<Student> {
  try {
    const token = (await cookies()).get(ACCESS_TOKEN_KEY)?.value;
    const incomingAuth = (await headers()).get("authorization");
    const bearer = incomingAuth || (token ? `Bearer ${token}` : "");

    const dto = await httpJson<StudentApiDto>(API_ROUTES.students(id), {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(bearer ? { Authorization: bearer } : {}),
      },
    });

    if (!dto) notFound();
    return mapApiToStudent(dto);
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) notFound();
    throw e;
  }
}
