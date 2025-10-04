"use client";

import type { Student } from "@/entities/student/model/types";
import { StudentDetailsContainer } from "@/features/student/ui/StudentDetailsContainer";

export default function StudentDetails({ student }: { student: Student }) {
  return <StudentDetailsContainer student={student} />;
}
