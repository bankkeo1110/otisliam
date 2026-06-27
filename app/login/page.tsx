'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    localStorage.setItem('mathapp_student_id', String(data.studentId));
    localStorage.setItem('mathapp_student_name', data.name);
    window.dispatchEvent(new Event('mathapp_student_changed'));
    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="bg-[#1a1a1a] text-[#FFD015] font-black text-2xl w-12 h-12 rounded-2xl flex items-center justify-center card-comic">M</div>
            <span className="font-black text-2xl text-[#1a1a1a] tracking-wide">MATH FUN</span>
          </Link>
        </div>

        <div className="card-comic bg-white rounded-3xl p-8">
          <h1 className="font-black text-2xl tracking-wide mb-6 text-[#1a1a1a]">SIGN IN 👋</h1>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="font-black text-xs tracking-[0.15em] text-gray-500 block mb-1.5">USERNAME</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoFocus
                placeholder="Your username"
                className="card-comic-sm w-full px-4 py-3 rounded-xl font-semibold text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#FFD015] border-[#1a1a1a]"
              />
            </div>

            <div>
              <label className="font-black text-xs tracking-[0.15em] text-gray-500 block mb-1.5">PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="card-comic-sm w-full px-4 py-3 rounded-xl font-semibold text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#FFD015] border-[#1a1a1a]"
              />
            </div>

            {error && (
              <div className="card-comic-sm border-red-400 bg-red-50 text-red-600 font-bold text-sm px-4 py-3 rounded-xl">
                ❌ {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="card-comic w-full bg-[#FFD015] text-[#1a1a1a] font-black py-3.5 rounded-xl text-lg hover:bg-yellow-300 transition disabled:opacity-60 mt-2">
              {loading ? 'Signing in...' : '▶ SIGN IN'}
            </button>
          </form>

          <div className="mt-6 text-center border-t-2 border-gray-100 pt-5">
            <p className="text-gray-500 font-semibold text-sm">Don&apos;t have an account?</p>
            <Link href="/signup" className="font-black text-[#4A6CF7] hover:underline">
              Sign up here →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
