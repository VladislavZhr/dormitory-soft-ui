// src/features/students/ui/DashboardView.tsx
// TypeScript strict
"use client";

import * as React from "react";
import Link from "next/link";
import type { DashboardViewProps } from "../model/contracts";

import ComboBox from "./dashboardElement/ComboBox";
import AddStudentModal from "./modals/AddStudentModal";
import ExportStudentsModal from "./modals/ExportStudentsModal";
import ImportStudentsModal from "./modals/ImportStudentsModal";

// Скільки номерів сторінок показувати одночасно.
// Поміняй на 10, якщо треба більше.
const VISIBLE_PAGES = 7;

/** Повертає масив номерів сторінок довжиною до VISIBLE_PAGES зі зсувом навколо current */
function slidingPages(totalPages: number, current: number, windowSize = VISIBLE_PAGES): number[] {
  if (totalPages <= 0) return [];
  const size = Math.max(1, Math.min(windowSize, totalPages));
  const half = Math.floor(size / 2);

  let start = current - half;
  let end = start + size - 1;

  if (start < 1) {
    start = 1;
    end = Math.min(totalPages, start + size - 1);
  } else if (end > totalPages) {
    end = totalPages;
    start = Math.max(1, end - size + 1);
  }

  const out: number[] = [];
  for (let p = start; p <= end; p++) out.push(p);
  return out;
}

export default function DashboardView({
  residents,

  // завантаження
  isLoading,
  isError,
  onReload,

  // опції (єдина сутність)
  filtersOptions,

  // значення фільтрів + обробники
  fullNameValue,
  onFullNameChange,
  roomNumberValue,
  onRoomNumberChange,
  facultyValue,
  onFacultyChange,
  studyGroupValue,
  onStudyGroupChange,

  // пагінація
  page,
  totalPages,
  onPageChange,

  // модалки
  isAddOpen,
  isImportOpen,
  onOpenAdd,
  onOpenImport,
  onCloseAdd,
  onCloseImport,
  onAddSubmit,
  onImported,

  // експорт
  isExportOpen,
  isExporting,
  onOpenExport,
  onCloseExport,
  onConfirmExport,
}: DashboardViewProps) {
  // ❗️Лише видиме «вікно» сторінок, не всі одразу
  const pages = React.useMemo(() => slidingPages(totalPages, page, VISIBLE_PAGES), [totalPages, page]);

  const isAllEmpty =
    (!fullNameValue || fullNameValue.trim() === "") &&
    (!roomNumberValue || roomNumberValue.trim() === "") &&
    (!facultyValue || facultyValue.trim() === "") &&
    (!studyGroupValue || studyGroupValue.trim() === "");

  const handleClearFilters = React.useCallback(() => {
    onFullNameChange(null);
    onRoomNumberChange(null);
    onFacultyChange(null);
    onStudyGroupChange(null);
  }, [onFullNameChange, onRoomNumberChange, onFacultyChange, onStudyGroupChange]);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
        {/* Заголовок */}
        <div className="mb-6">
          <h1 className="text-center text-2xl font-semibold tracking-tight text-slate-900">Список мешканців гуртожитку №8</h1>
        </div>

        <div className="mb-4 flex flex-col gap-4">
          {/* Панель фільтрів */}
          <div className="w-full">
            <div className="inline-flex flex-nowrap items-center gap-4 whitespace-nowrap">
              <ComboBox
                label="Пошук за прізвищем"
                items={filtersOptions.fullName}
                placeholder="Введіть ПІБ"
                className="w-[20rem] sm:w-80"
                value={fullNameValue}
                onChange={onFullNameChange}
                onInputChange={onFullNameChange}
              />

              <ComboBox
                label="Кімната"
                items={filtersOptions.roomNumber}
                placeholder="Напр. 101"
                className="w-36"
                inputProps={{ inputMode: "numeric", pattern: "\\d*" }}
                value={roomNumberValue}
                onChange={onRoomNumberChange}
                onInputChange={onRoomNumberChange}
              />

              <ComboBox label="Факультет" items={filtersOptions.faculty} placeholder="ФІОТ, ІПСА…" className="w-44" value={facultyValue} onChange={onFacultyChange} onInputChange={onFacultyChange} />

              <ComboBox
                label="Група"
                items={filtersOptions.studyGroup}
                placeholder="Напр. ІН-31"
                className="w-40"
                value={studyGroupValue}
                onChange={onStudyGroupChange}
                onInputChange={onStudyGroupChange}
              />

              <button
                type="button"
                onClick={handleClearFilters}
                disabled={isAllEmpty}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                title="Очистити всі фільтри"
              >
                Очистити
              </button>
            </div>
          </div>

          {/* Дії */}
          <div className="flex w-full flex-wrap gap-2">
            <button
              onClick={onOpenAdd}
              type="button"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-green-500 px-3 py-2 text-sm font-medium text-white hover:bg-green-600"
            >
              Додати студента
            </button>

            <button onClick={onOpenImport} type="button" className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Імпортувати студентів (Excel)
            </button>

            {/* Експорт */}
            <button
              onClick={onOpenExport}
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-purple-300 bg-white px-3 py-2 text-sm font-medium text-purple-700 shadow-sm hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="currentColor">
                <path d="M12 3a1 1 0 0 1 1 1v8.586l2.293-2.293a1 1 0 1 1 1.414 1.414l-4.007 4.007a1 1 0 0 1-1.414 0L7.279 11.707a1 1 0 0 1 1.414-1.414L11 12.586V4a1 1 0 0 1 1-1z" />
                <path d="M5 15a1 1 0 0 1 1 1v2h12v-2a1 1 0 1 1 2 0v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1z" />
              </svg>
              Список Студентів з Інвентарем (Excel)
            </button>

            <div className="ml-auto flex items-center gap-2">
              {isLoading && <span className="text-sm text-slate-600">Завантаження…</span>}
              {isError && (
                <button onClick={onReload} type="button" className="text-sm text-red-600 underline underline-offset-2">
                  Помилка. Спробувати ще раз
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Модалки */}
        <AddStudentModal open={isAddOpen} onClose={onCloseAdd} onSubmit={onAddSubmit} />
        <ImportStudentsModal open={isImportOpen} onClose={onCloseImport} onImported={onImported} />
        <ExportStudentsModal open={isExportOpen} onClose={onCloseExport} onConfirm={onConfirmExport} isProcessing={isExporting} />

        {/* Таблиця */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="max-h-[60vh] overflow-auto">
            <table className="min-w-full table-fixed border-collapse text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-slate-600">
                <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:font-medium text-center">
                  <th className="w-[6%]">ID</th>
                  <th className="w-[35%]">ПІБ</th>
                  <th className="w-[15%]">Номер Кімнати</th>
                  <th className="w-[14%]">Факультет</th>
                  <th className="w-[10%]">Група</th>
                  <th className="w-[10%] text-center">Інвентар Студента</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {residents.map((r) => (
                  <tr key={r.id} className="text-center hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700">{r.id}</td>
                    <td className="px-4 py-3 text-center font-medium text-slate-900">{r.fullName}</td>
                    <td className="px-4 py-3 text-slate-700">{r.roomNumber}</td>
                    <td className="px-4 py-3 text-slate-700">
                      <div className="max-w-full truncate" title={r.faculty}>
                        {r.faculty}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{r.studyGroup}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <Link
                          href={`/students/${encodeURIComponent(r.id)}`}
                          prefetch={false}
                          type="button"
                          className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                        >
                          Переглянути
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {residents.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      Нічого не знайдено
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Пагінація */}
          <div className="flex items-center justify-center gap-2 border-t border-slate-200 p-3">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Попередня сторінка"
              disabled={page <= 1}
            >
              ‹
            </button>

            {pages.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onPageChange(n)}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-md border ${
                  n === page ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                }`}
                aria-current={n === page ? "page" : undefined}
              >
                {n}
              </button>
            ))}

            <button
              type="button"
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Наступна сторінка"
              disabled={page >= totalPages}
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
