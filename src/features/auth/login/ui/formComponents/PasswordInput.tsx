"use client";

import { memo, useState } from "react";

type PasswordInputProps = {
  id?: string;
  name?: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
};

function PasswordInputImpl({ id = "password", name = "password", value, onChange, placeholder }: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        Пароль
      </label>
      <div className="flex rounded-lg border border-slate-300 bg-white">
        <input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="current-password"
          placeholder={placeholder}
          className="h-10 w-full rounded-l-lg bg-transparent px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="h-10 cursor-pointer rounded-r-lg px-3 text-sm text-slate-700 transition-colors hover:bg-slate-50"
          aria-label={show ? "Приховати пароль" : "Показати пароль"}
        >
          {show ? "Сховати" : "Показати"}
        </button>
      </div>
    </div>
  );
}

const PasswordInput = memo(PasswordInputImpl);
export default PasswordInput;
