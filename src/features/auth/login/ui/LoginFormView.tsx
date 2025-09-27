"use client";

import Alert from "./formComponents/Alert";
import PasswordInput from "./formComponents/PasswordInput";
import SubmitButton from "./formComponents/SubmitButton";

type Props = {
  username: string;
  onUsernameChange: (v: string) => void;
  password: string;
  onPasswordChange: (v: string) => void;

  usernameError: string | null;
  passwordError: string | null;
  rootError: string | null;

  loading: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
};

export default function LoginFormView({ username, onUsernameChange, password, onPasswordChange, usernameError, passwordError, rootError, loading, onSubmit }: Props) {
  return (
    <div className="w-full max-w-md rounded-2xl border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur-xl">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-xl bg-blue-400/15 ring-1 ring-blue-200/50">
          <span className="text-xl">🏠</span>
        </div>
        <h1 className="text-lg font-semibold text-slate-900">Панель гуртожитку</h1>
        <p className="text-sm text-slate-600">Увійдіть до системи</p>
      </div>

      {rootError ? <Alert type="error">{rootError}</Alert> : null}

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Username */}
        <div>
          <label htmlFor="username" className="mb-1 block text-sm font-medium text-slate-700">
            Логін
          </label>
          <input
            id="username"
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            autoComplete="username"
            placeholder="admin"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          {usernameError ? <p className="mt-1 text-xs text-rose-600">{usernameError}</p> : null}
        </div>

        {/* Password */}
        <>
          <PasswordInput value={password} onChange={onPasswordChange} placeholder="qwerty123" />
          {passwordError ? <p className="mt-1 text-xs text-rose-600">{passwordError}</p> : null}
        </>

        <SubmitButton loading={loading}>Увійти</SubmitButton>
      </form>
    </div>
  );
}
