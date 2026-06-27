'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const AVATAR_COLORS = ['bg-red-400', 'bg-blue-400', 'bg-purple-400', 'bg-green-500', 'bg-orange-400'];
function colorForName(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

interface AuthUser { studentId: number; name: string; }

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checked, setChecked] = useState(false);

  const fetchUser = () => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      setUser(d.user ?? null);
      setChecked(true);
    });
  };

  useEffect(() => {
    fetchUser();
    window.addEventListener('mathapp_student_changed', fetchUser);
    return () => window.removeEventListener('mathapp_student_changed', fetchUser);
  }, []);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('mathapp_student_id');
    localStorage.removeItem('mathapp_student_name');
    localStorage.removeItem('mathapp_last_topic');
    setUser(null);
    router.push('/login');
    router.refresh();
  };

  const link = (href: string, label: string) => {
    const active = pathname === href || (href !== '/' && pathname.startsWith(href));
    return (
      <Link href={href}
        className={`font-black text-sm px-4 py-1.5 rounded-lg transition ${
          active ? 'bg-[#1a1a1a] text-white' : 'text-[#1a1a1a] hover:bg-black/10'
        }`}>
        {label}
      </Link>
    );
  };

  return (
    <nav className="bg-[#FFD015] border-b-4 border-[#1a1a1a] px-6 py-3 flex items-center gap-4">
      <Link href="/" className="flex items-center gap-2 mr-4">
        <div className="bg-[#1a1a1a] text-[#FFD015] font-black text-lg w-9 h-9 rounded-xl flex items-center justify-center select-none">M</div>
        <span className="font-black text-[#1a1a1a] text-xl tracking-wide">MATH FUN</span>
      </Link>

      <div className="flex items-center gap-1">
        {link('/', 'Home')}
        {link('/practice', 'Practice')}
        {link('/members', 'Members')}
        {link('/report', 'Progress')}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {checked && !user && (
          <>
            <Link href="/login" className="card-comic-sm bg-white text-[#1a1a1a] font-black text-xs px-3 py-1.5 rounded-lg hover:bg-yellow-50 transition">
              Sign In
            </Link>
            <Link href="/signup" className="card-comic-sm bg-[#1a1a1a] text-white font-black text-xs px-3 py-1.5 rounded-lg hover:opacity-80 transition">
              Sign Up
            </Link>
          </>
        )}
        {user && (
          <div className="flex items-center gap-2">
            <Link href={`/student/${user.studentId}`} title={user.name}
              className={`${colorForName(user.name)} card-comic-sm text-white font-black w-9 h-9 rounded-xl flex items-center justify-center text-sm select-none hover:opacity-90`}>
              {user.name[0].toUpperCase()}
            </Link>
            <span className="font-black text-sm text-[#1a1a1a] hidden sm:block">{user.name}</span>
            <button onClick={logout}
              className="card-comic-sm bg-white text-[#1a1a1a] font-black text-xs px-3 py-1.5 rounded-lg hover:bg-red-50 hover:border-red-400 hover:text-red-600 transition">
              Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
