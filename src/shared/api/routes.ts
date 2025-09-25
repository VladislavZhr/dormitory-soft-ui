// src/shared/api/routes.ts

export const API_ROUTES = {
  students: (id: number) => `/api/students/${id}`,
} as const;
