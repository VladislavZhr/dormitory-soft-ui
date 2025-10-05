// src/features/dashboard/model/contracts.ts
// TypeScript strict

// 1) Реекспорт доменних типів (без дублювання структур)
export type { Student, DashboardFilters, FiltersOptions, PageParams, PaginationMeta, Paginated, DashboardListResponse } from "@/entities/student/model/types";

// 2) Локальні UI-контракти фічі (пропси компонентів)
export type ComboBoxProps = {
  label: string;
  items: string[];
  placeholder?: string;
  className?: string;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  value?: string | null;
  onInputChange?: (q: string) => void;
  onChange?: (v: string | null) => void;
  disabled?: boolean;
  id?: string;
};

// Використовуємо доменні типи як залежності для пропсів
import type { Student, FiltersOptions } from "@/entities/student/model/types";

import type { FormOutput } from "./schema";

export type DashboardViewProps = {
  // дані для таблиці (враховано поточну сторінку)
  residents: Student[];

  // стани завантаження
  isLoading?: boolean;
  isError?: boolean;
  onReload?: () => void;

  // опції фільтрів (єдина сутність)
  filtersOptions: FiltersOptions;

  // значення фільтрів   обробники
  fullNameValue: string | null;
  onFullNameChange: (v: string | null) => void;
  roomNumberValue: string | null;
  onRoomNumberChange: (v: string | null) => void;
  facultyValue: string | null;
  onFacultyChange: (v: string | null) => void;
  studyGroupValue: string | null;
  onStudyGroupChange: (v: string | null) => void;

  // пагінація
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;

  // модалки (керування зовні)
  isAddOpen: boolean;
  isImportOpen: boolean;
  onOpenAdd: () => void;
  onOpenImport: () => void;
  onCloseAdd: () => void;
  onCloseImport: () => void;
  onAddSubmit: () => void;
  onImported: () => void;
  // експорт
  isExportOpen: boolean;
  isExporting: boolean;
  onOpenExport: () => void;
  onCloseExport: () => void;
  onConfirmExport: () => void;
};

export type AddStudentModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit?: (data: FormOutput) => void;
};
