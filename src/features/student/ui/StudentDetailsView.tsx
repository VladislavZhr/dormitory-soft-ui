'use client';

import type { Student } from '@/entities/student/model/types';
import Info from '@/shared/ui/Info';

type Form = {
  fullName: string;
  roomNumber: string;
  faculty: string;
  studyGroup: string;
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
      {/* Заголовок */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">{student.fullName}</h1>
        <span className="rounded-full bg-blue-600/10 px-3 py-1 text-xs font-medium text-blue-700 flex items-center">
          ID {student.id}
        </span>
      </div>

      {/* Поля та кнопки */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Info
          label="ПІБ"
          value={edit ? form.fullName : student.fullName}
          edit={edit}
          onChange={onFieldChange('fullName')}
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
      </div>

      {/* Кнопки */}
      {/* Кнопки */}
      <div className="mt-6 flex flex-wrap gap-3">
        {!edit ? (
          <>
            <button
              type="button"
              onClick={onToggleEdit}
              className="h-10 rounded-lg bg-blue-600 px-8 text-sm font-medium text-white hover:bg-blue-700"
            >
              Редагувати
            </button>
            <button
              type="button"
              onClick={onEvictOpen}
              className="h-10 rounded-lg bg-rose-600 px-8 text-sm font-medium text-white hover:bg-rose-700"
            >
              Виселити
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onToggleEdit}
              disabled={saving}
              className="h-10 rounded-lg border border-slate-300 bg-white px-8 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Скасувати
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="h-10 rounded-lg bg-blue-600 px-8 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Збереження…' : 'Зберегти зміни'}
            </button>
          </>
        )}
      </div>

      {/* Помилка */}
      {error && (
        <div
          className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
          role="alert"
        >
          {error}
        </div>
      )}
    </div>
  );
}
