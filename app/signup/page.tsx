'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SignupForm() {
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/';

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password }),
      credentials: 'same-origin',
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    localStorage.setItem('mathapp_student_id', String(data.studentId));
    localStorage.setItem('mathapp_student_name', data.name);
    // Hard redirect so the browser sends the new cookie on the next request
    window.location.href = from;
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-sm">

        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="bg-[#1a1a1a] text-[#FFD015] font-black text-2xl w-12 h-12 rounded-2xl flex items-center justify-center card-comic">M</div>
            <span className="font-black text-2xl text-[#1a1a1a] tracking-wide">MATH FUN</span>
          </Link>
        </div>

        <div className="card-comic bg-white rounded-3xl p-8">
          <h1 className="font-black text-2xl tracking-wide mb-1 text-[#1a1a1a]">CREATE ACCOUNT 🚀</h1>
          <p className="text-gray-400 font-semibold text-sm mb-6">Start earning badges today!</p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="font-black text-xs tracking-[0.15em] text-gray-500 block mb-1.5">USERNAME</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                minLength={2}
                autoFocus
                placeholder="Pick a cool username"
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
                minLength={4}
                placeholder="Min 4 characters"
                className="card-comic-sm w-full px-4 py-3 rounded-xl font-semibold text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#FFD015] border-[#1a1a1a]"
              />
            </div>

            <div>
              <label className="font-black text-xs tracking-[0.15em] text-gray-500 block mb-1.5">CONFIRM PASSWORD</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                placeholder="Repeat your password"
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
              {loading ? 'Creating account...' : '🚀 CREATE ACCOUNT'}
            </button>
          </form>

          <div className="mt-6 text-center border-t-2 border-gray-100 pt-5">
            <p className="text-gray-500 font-semibold text-sm">Already have an account?</p>
            <Link href={`/login${from !== '/' ? `?from=${encodeURIComponent(from)}` : ''}`}
              className="font-black text-[#4A6CF7] hover:underline">
              Sign in here →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
