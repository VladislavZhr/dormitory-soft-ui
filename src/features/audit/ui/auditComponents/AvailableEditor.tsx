export default function AvailableEditor({ value, onChange, onSave }: { value: number; onChange: (v: number) => void; onSave: () => void }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value || 0)))}
        onKeyDown={(e) => e.key === "Enter" && onSave()}
        className="w-20 rounded-md border border-slate-300 bg-white px-2 py-1 text-center text-sm text-slate-900 focus:outline-none"
      />
      <button type="button" onClick={onSave} className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">
        Зберегти
      </button>
    </div>
  );
}
