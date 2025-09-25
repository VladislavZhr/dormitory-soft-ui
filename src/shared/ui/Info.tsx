'use client';

import type { ChangeEvent } from 'react';

type Props = {
  label: string;
  value: string;
  edit?: boolean;
  type?: 'text' | 'number';
  wide?: boolean;
  onChange?: (v: string) => void;
};

export default function Info({
  label,
  value,
  edit = false,
  type = 'text',
  wide = false,
  onChange,
}: Props) {
  return (
    <div className={`flex flex-col ${wide ? 'col-span-2' : ''}`}>
      <span className="text-xs font-medium text-slate-500">{label}</span>

      {edit ? (
        <input
          type={type}
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value)}
          className="mt-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      ) : (
        <span className="mt-1 rounded-lg bg-slate-50 px-2 py-1 text-sm text-slate-900">
          {value || '—'}
        </span>
      )}
    </div>
  );
}
