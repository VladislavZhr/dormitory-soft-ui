// src/features/students/ui/DashboardContainer.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import * as React from "react";

import type { Student, FiltersOptions } from "@/entities/student/model/types";
import { downloadAssignedXlsx } from "@/features/dashboard/api/client"; // ⬅ додано

import { getAllStudents } from "../api/client";
import { useDebounce } from "../lib/useDebounce";

import DashboardView from "./DashboardView";

const PAGE_SIZE = 7;

export default function DashboardContainer() {
  const [isAddOpen, setAddOpen] = React.useState(false);
  const [isImportOpen, setImportOpen] = React.useState(false);

  // ⬇⬇ нове: стан модалки експорту та індикатор процесу
  const [isExportOpen, setExportOpen] = React.useState(false);
  const [isExporting, setExporting] = React.useState(false);

  // Текст фільтрів (вільний ввід)
  const [fullName, setFullName] = React.useState<string | null>(null);
  const [roomNumber, setRoomNumber] = React.useState<string | null>(null);
  const [faculty, setFaculty] = React.useState<string | null>(null);
  const [studyGroup, setStudyGroup] = React.useState<string | null>(null);

  // Debounce значення (щоб не фільтрувати на кожен кейстрок)
  const dFullName = useDebounce(fullName ?? "");
  const dRoom = useDebounce(roomNumber ?? "");
  const dFaculty = useDebounce(faculty ?? "");
  const dGroup = useDebounce(studyGroup ?? "");

  // Пагінація (клієнтська)
  const [page, setPage] = React.useState(1);

  // Тягнемо ВЕСЬ список (без серверних фільтрів/пагінації)
  const { data, isLoading, isError, refetch } = useQuery<Student[]>({
    queryKey: ["dashboard-all"],
    queryFn: () => getAllStudents({}),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });

  const residentsAll: Student[] = data ?? [];

  const isEmpty = (s: string | null | undefined) => !s || s.trim() === "";

  // Клієнтська фільтрація під debounce
  const residentsFiltered = React.useMemo(() => {
    if ([dFullName, dRoom, dFaculty, dGroup].every((s) => isEmpty(s))) {
      return residentsAll;
    }
    const inc = (q: string, v: string) => v.toLowerCase().includes(q.toLowerCase().trim());
    return residentsAll.filter(
      (r) =>
        (isEmpty(dFullName) || inc(dFullName, r.fullName)) &&
        (isEmpty(dRoom) || inc(dRoom, r.roomNumber)) &&
        (isEmpty(dFaculty) || inc(dFaculty, r.faculty)) &&
        (isEmpty(dGroup) || inc(dGroup, r.studyGroup)),
    );
  }, [residentsAll, dFullName, dRoom, dFaculty, dGroup]);

  // Пагінація (клієнтська)
  const totalPages = Math.max(1, Math.ceil(residentsFiltered.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const residents = React.useMemo(() => residentsFiltered.slice(start, end), [residentsFiltered, start, end]);

  // Опції фільтрів генеруємо з ПОВНОГО списку
  const filtersOptions: FiltersOptions = React.useMemo(() => {
    const uniq = <T,>(arr: T[]) => Array.from(new Set(arr));
    return {
      fullName: uniq(residentsAll.map((r) => r.fullName)),
      roomNumber: uniq(residentsAll.map((r) => r.roomNumber)),
      faculty: uniq(residentsAll.map((r) => r.faculty)),
      studyGroup: uniq(residentsAll.map((r) => r.studyGroup)),
    };
  }, [residentsAll]);

  // На зміну фільтрів — повертаємось на першу сторінку
  React.useEffect(() => {
    setPage(1);
  }, [dFullName, dRoom, dFaculty, dGroup]);

  // Якщо page вийшла за межі після фільтрації — підрівнюємо
  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // ⬇⬇ нове: підтвердження експорту (аналог твоєї реалізації)
  const onConfirmExport = React.useCallback(async () => {
    try {
      setExporting(true);
      await downloadAssignedXlsx({ fileName: "assigned.xlsx" });
      setExportOpen(false);
    } catch (e) {
      console.error(e);
      // TODO: toast/alert
    } finally {
      setExporting(false);
    }
  }, []);

  return (
    <DashboardView
      // дані
      residents={residents}
      isLoading={isLoading}
      isError={isError}
      onReload={() => refetch()}
      // опції фільтрів
      filtersOptions={filtersOptions}
      // значення фільтрів + обробники
      fullNameValue={fullName}
      onFullNameChange={setFullName}
      roomNumberValue={roomNumber}
      onRoomNumberChange={setRoomNumber}
      facultyValue={faculty}
      onFacultyChange={setFaculty}
      studyGroupValue={studyGroup}
      onStudyGroupChange={setStudyGroup}
      // пагінація
      page={page}
      totalPages={totalPages}
      onPageChange={setPage}
      // модалки
      isAddOpen={isAddOpen}
      isImportOpen={isImportOpen}
      onOpenAdd={() => setAddOpen(true)}
      onOpenImport={() => setImportOpen(true)}
      onCloseAdd={() => setAddOpen(false)}
      onCloseImport={() => setImportOpen(false)}
      onAddSubmit={() => {
        setAddOpen(false);
        refetch();
      }}
      onImported={() => {
        setImportOpen(false);
        refetch();
      }}
      // ⬇⬇ нове: експорт
      isExportOpen={isExportOpen}
      isExporting={isExporting}
      onOpenExport={() => setExportOpen(true)}
      onCloseExport={() => setExportOpen(false)}
      onConfirmExport={onConfirmExport}
    />
  );
}
