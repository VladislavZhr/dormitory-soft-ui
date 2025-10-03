// src/features/student/ui/StudentDetailsContainer.tsx
"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { Student } from "@/entities/student/model/types";
import { updateStudent, deleteStudent } from "@/features/student/api/client";
import { extractErrorMessage } from "@/shared/lib/error"; // одна утиліта для всіх кейсів

import ConfirmEvictModal from "./modals/ConfirmEvictModal";
import StudentDetailsView from "./StudentDetailsView";

type FormState = {
  fullName: string;
  roomNumber: string;
  faculty: string;
  studyGroup: string;
};

export function StudentDetailsContainer({ student }: { student: Student }) {
  const router = useRouter();

  const initialForm: FormState = useMemo(
    () => ({
      fullName: student.fullName,
      roomNumber: student.roomNumber,
      faculty: student.faculty,
      studyGroup: student.studyGroup,
    }),
    [student],
  );

  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [saving, setSaving] = useState(false);
  const [evictOpen, setEvictOpen] = useState(false);
  const [evicting, setEvicting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = (k: keyof FormState) => (v: string) => setForm((s) => ({ ...s, [k]: v }));

  const onToggleEdit = () => {
    if (saving) return;
    if (edit) {
      setForm(initialForm);
      setError(null);
    }
    setEdit((v) => !v);
  };

  const onSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        roomNumber: form.roomNumber.trim(),
        faculty: form.faculty.trim(),
        studyGroup: form.studyGroup.trim(),
      };

      const body = Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== "" && v !== undefined && v !== null && !(typeof v === "number" && Number.isNaN(v))));

      await updateStudent(student.id, body);
      setEdit(false);
      // за потреби:
      // router.refresh();
    } catch (e: unknown) {
      setError(extractErrorMessage(e) ?? "Помилка збереження");
    } finally {
      setSaving(false);
    }
  };

  const onEvictOpen = () => setEvictOpen(true);
  const onEvictClose = () => {
    if (!evicting) setEvictOpen(false);
  };

  const onConfirmEvict = async () => {
    setEvicting(true);
    setError(null);
    try {
      await deleteStudent(student.id);
      router.push("/"); // заміни на потрібний маршрут
    } catch (e: unknown) {
      setError(extractErrorMessage(e) ?? "Не вдалось видалити студента");
    } finally {
      setEvicting(false);
      setEvictOpen(false);
    }
  };

  return (
    <>
      <StudentDetailsView student={student} edit={edit} form={form} saving={saving} error={error} onToggleEdit={onToggleEdit} onFieldChange={setField} onSave={onSave} onEvictOpen={onEvictOpen} />

      <ConfirmEvictModal open={evictOpen} loading={evicting} onClose={onEvictClose} onConfirm={onConfirmEvict} />
    </>
  );
}
