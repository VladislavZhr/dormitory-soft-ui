// src/shared/api/routes.ts
export const API_ROUTES = {
  students: (id: string | number) => `/api/students/${encodeURIComponent(String(id))}`,
  inventory: {
    studentItems: (studentId: number | string) => `/api/inventory/students/${encodeURIComponent(String(studentId))}/items`,
    issue: `/api/inventory/issue`,
    return: `/api/inventory/return`,
    logs: (studentId: number | string) => `/api/inventory/students/${encodeURIComponent(String(studentId))}/logs`,
  },
} as const;
