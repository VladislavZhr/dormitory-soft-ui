"use client";

type Props = {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ConfirmEvictModal({ open, loading, onClose, onConfirm }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="evict-title">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <h2 id="evict-title" className="text-lg font-semibold text-slate-900">
          Підтвердити виселення
        </h2>
        <p className="mt-2 text-sm text-slate-600">Ви дійсно хочете виселити цього студента? Дію не можна буде скасувати.</p>

        <div className="mt-5 flex justify-end gap-2">
          <button className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50" onClick={onClose} disabled={loading}>
            Скасувати
          </button>
          <button className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50" onClick={onConfirm} disabled={loading}>
            {loading ? "Видалення…" : "Виселити"}
          </button>
        </div>
      </div>
    </div>
  );
}
