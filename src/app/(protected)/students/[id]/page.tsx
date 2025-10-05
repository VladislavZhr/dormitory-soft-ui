import { getStudentServer } from "@/features/student/api/server";
import StudentDetails from "@/widgets/student-details/ui/StudentDetails";
import StudentInventorySection from "@/widgets/student-inventory-section/ui/StudentInventorySection";

export const dynamic = "force-dynamic";

type Params = { id: string };

export default async function Page({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const student = await getStudentServer(id);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 lg:px-10 space-y-8">
        {/* картка з даними студента */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <StudentDetails student={student} />
        </div>

        {/* картка з інвентарем */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <StudentInventorySection student={student} studentId={Number(student.id)} />
        </div>
      </div>
    </main>
  );
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  return { title: `Student ${id}` };
}
