'use client';

import type { Student } from '@/entities/student/model/types';
import Info from '@/shared/ui/Info';

type Form = {
  fullName: string;
  roomNumber: string;
  faculty: string;
  studyGroup: string;
  course: string;
};

type Props = {
  student: Student;
  edit: boolean;
  form: Form;
  saving: boolean;
  error: string | null;
  onToggleEdit: () => void;
  onFieldChange: (k: keyof Form) => (v: string) => void;
  onSave: () => void;
  onEvictOpen: () => void;
};

export default function StudentDetailsView({
  student,
  edit,
  form,
  saving,
  error,
  onToggleEdit,
  onFieldChange,
  onSave,
  onEvictOpen,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-slate-900">
              {edit ? form.fullName || '—' : student.fullName}
            </h1>
            <span className="rounded-full bg-blue-600/10 px-3 py-1 text-xs font-medium text-blue-700">
              ID {student.id}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-700 sm:grid-cols-3 md:grid-cols-4">
            <Info
              label="ПІБ"
              value={edit ? form.fullName : student.fullName}
              edit={edit}
              onChange={onFieldChange('fullName')}
              wide
            />
            <Info
              label="Кімната"
              value={edit ? form.roomNumber : student.roomNumber}
              edit={edit}
              onChange={onFieldChange('roomNumber')}
            />
            <Info
              label="Факультет"
              value={edit ? form.faculty : student.faculty}
              edit={edit}
              onChange={onFieldChange('faculty')}
            />
            <Info
              label="Група"
              value={edit ? form.studyGroup : student.studyGroup}
              edit={edit}
              onChange={onFieldChange('studyGroup')}
            />
            <Info
              label="Курс"
              value={edit ? form.course : String(student.course)}
              type="number"
              edit={edit}
              onChange={onFieldChange('course')}
            />
          </div>

          {error && (
            <div
              className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
              role="alert"
            >
              {error}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {!edit ? (
            <>
              <button
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                onClick={onToggleEdit}
              >
                Редагувати
              </button>
              <button
                className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700"
                onClick={onEvictOpen}
              >
                Виселити
              </button>
            </>
          ) : (
            <>
              <button
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                onClick={onToggleEdit}
                disabled={saving}
              >
                Скасувати
              </button>
              <button
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                onClick={onSave}
                disabled={saving}
              >
                {saving ? 'Збереження…' : 'Зберегти зміни'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
