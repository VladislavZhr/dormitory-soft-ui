// src/shared/api/routes.ts

export const API_ROUTES = {
  students: (id: string | number) => `/api/students/${encodeURIComponent(String(id))}`,
} as const;
