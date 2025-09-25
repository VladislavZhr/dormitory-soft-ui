import { getStudentServer } from '@/features/student/api/server';
import StudentDetails from '@/widgets/student-details/ui/StudentDetails';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: { id: string } }) {
  const student = await getStudentServer(params.id);
  return <StudentDetails student={student} />;
}
