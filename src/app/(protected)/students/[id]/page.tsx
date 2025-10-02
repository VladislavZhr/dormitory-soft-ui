// src/app/(protected)/students/[id]/page.tsx
import { getStudentServer } from '@/features/student/api/server';
import StudentDetails from '@/widgets/student-details/ui/StudentDetails';
import StudentInventorySection from '@/widgets/student-inventory-section/ui/StudentInventorySection';

export const dynamic = 'force-dynamic';

type Params = { id: string };

export default async function Page({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const student = await getStudentServer(id);

  return (
    <div className="space-y-6">
      <StudentDetails student={student} />
      <StudentInventorySection
        student={student} // ✅ додано
        studentId={Number(student.id)}
      />
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  return { title: `Student ${id}` };
}
