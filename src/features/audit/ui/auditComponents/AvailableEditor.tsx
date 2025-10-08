// TypeScript strict
"use client";

import * as React from "react";

type Props = {
  /** Поточне значення total у рядку таблиці */
  total: number;
  /** Колбек під час зміни total (надсилаємо лише total) */
  onChangeTotal: (v: number) => void;
  /** Збереження (батько робить upsert { kind, total }) */
  onSave: () => void;
};

function toNumOrUndef(s: string): number | undefined {
  if (s.trim() === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Редактор «Загалом (total)».
 * Локальний РЯДКОВИЙ стан, щоб значення не зникало під час набору.
 * Валідація: не від’ємні цілі числа.
 */
export default function AvailableEditor({ total, onChangeTotal, onSave }: Props): React.JSX.Element {
  const [totalStr, setTotalStr] = React.useState<string>(String(total));

  // Синхронізуємо локальний стан, якщо total зверху змінився
  React.useEffect(() => setTotalStr(String(total)), [total]);

  const handleChange = (s: string) => {
    setTotalStr(s);
    const n = toNumOrUndef(s);
    if (n !== undefined) onChangeTotal(Math.max(0, Math.trunc(n)));
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") onSave();
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={totalStr}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-20 rounded-md border border-slate-300 bg-white px-2 py-1 text-center text-sm text-slate-900 focus:outline-none"
        aria-label="Загалом"
        title="Загалом"
      />
      <button type="button" onClick={onSave} className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">
        Зберегти
      </button>
    </div>
  );
}
