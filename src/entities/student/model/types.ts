// src/entities/dashboard/model/types.ts
// TypeScript strict

/** Доменна модель студента (агностична до UI та транспорту) */
export type Student = {
  id: number;
  fullName: string;
  roomNumber: string;
  faculty: string;
  studyGroup: string;
};

/** Параметри фільтрів списку (сервер/клієнт — як зручно) */
export type DashboardFilters = {
  fullName?: string | null;
  roomNumber?: string | null;
  faculty?: string | null;
  studyGroup?: string | null;
};

/** Параметри пагінації */
export type PageParams = {
  page?: number;
  pageSize?: number;
};

/** Метадані пагінації */
export type PaginationMeta = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

/** Узагальнена відповідь із пагінацією */
export type Paginated<T> = {
  items: T[];
  meta: PaginationMeta;
};

/** Відповідь дашборду (список студентів) */
export type DashboardListResponse = Paginated<Student>;

export type FiltersOptions = {
  fullName: string[];
  roomNumber: string[];
  faculty: string[];
  studyGroup: string[];
};

export type DashboardDetailsProps = {
  student: Student | null;
};
