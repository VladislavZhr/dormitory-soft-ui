"use client";

import type { Student } from "@/entities/student/model/types";
import Section from "@/features/student-inventory/ui/Section";

export default function StudentInventorySection({ student, studentId }: { student: Student; studentId: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <Section student={student} studentId={studentId} />
    </div>
  );
}
