'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success' | null; text: string }>({
    type: null,
    text: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg({ type: null, text: '' });

    if (!username || !password) {
      setMsg({ type: 'error', text: 'Заповніть обидва поля.' });
      return;
    }

    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 500));
      if (username === 'admin' && password === 'qwerty123') {
        setMsg({ type: 'success', text: 'Вітаємо! Вхід виконано.' });
        router.push('/');
      } else {
        throw new Error('Невірні облікові дані');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-indigo-50 to-blue-100">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-md rounded-2xl border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur-xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-xl bg-blue-400/15 ring-1 ring-blue-200/50">
              <span className="text-xl">🏠</span>
            </div>
            <h1 className="text-lg font-semibold text-slate-900">Панель гуртожитку</h1>
            <p className="text-sm text-slate-600">Увійдіть до системи</p>
          </div>

          {msg.type && (
            <div
              className={`mb-4 rounded-lg px-3 py-2 text-sm ring-1 ${
                msg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                  : 'bg-rose-50 text-rose-700 ring-rose-200'
              }`}
            >
              {msg.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="mb-1 block text-sm font-medium text-slate-700">
                Логін
              </label>
              <input
                id="username"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="admin"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
                Пароль
              </label>
              <div className="flex rounded-lg border border-slate-300 bg-white">
                <input
                  id="password"
                  name="password"
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="qwerty123"
                  className="h-10 w-full rounded-l-lg bg-transparent px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="h-10 cursor-pointer rounded-r-lg px-3 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                  aria-label={showPwd ? 'Приховати пароль' : 'Показати пароль'}
                >
                  {showPwd ? 'Сховати' : 'Показати'}
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Мінімум 8 символів — у демо приймає qwerty123
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 cursor-pointer inline-flex w-full items-center justify-center rounded-lg bg-blue-500 px-3 py-2 text-sm font-medium text-white ring-1 ring-blue-200 transition-all duration-200 ease-out hover:-translate-y-[1px] hover:bg-blue-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none"
            >
              {loading ? 'Вхід…' : 'Увійти'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
