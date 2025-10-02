'use client';

import type { Student } from '@/entities/student/model/types';
import Section from '@/features/student-inventory/ui/Section';

export default function StudentInventorySection({
  student,
  studentId,
}: {
  student: Student;
  studentId: number;
}) {
  return <Section student={student} studentId={studentId} />;
}
