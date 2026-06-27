'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const AVATAR_COLORS = ['bg-red-400', 'bg-blue-400', 'bg-purple-400', 'bg-green-500', 'bg-orange-400'];

function colorForName(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

export default function Nav() {
  const pathname = usePathname();
  const [studentName, setStudentName] = useState<string | null>(null);

  useEffect(() => {
    setStudentName(localStorage.getItem('mathapp_student_name'));
    const onStorage = () => setStudentName(localStorage.getItem('mathapp_student_name'));
    window.addEventListener('storage', onStorage);
    window.addEventListener('mathapp_student_changed', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('mathapp_student_changed', onStorage);
    };
  }, []);

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
        <div className="bg-[#1a1a1a] text-[#FFD015] font-black text-lg w-9 h-9 rounded-xl flex items-center justify-center select-none">
          M
        </div>
        <span className="font-black text-[#1a1a1a] text-xl tracking-wide">MATH FUN</span>
      </Link>

      <div className="flex items-center gap-1">
        {link('/', 'Home')}
        {link('/practice', 'Practice')}
        {link('/members', 'Members')}
        {link('/report', 'Progress')}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {studentName && (
          <Link href="/members" title={studentName}
            className={`${colorForName(studentName)} card-comic-sm text-white font-black w-9 h-9 rounded-xl flex items-center justify-center text-sm select-none hover:opacity-90`}>
            {studentName[0].toUpperCase()}
          </Link>
        )}
        {!studentName && (
          <Link href="/practice"
            className="bg-white card-comic-sm text-[#1a1a1a] font-black text-xs px-3 py-1.5 rounded-lg hover:bg-yellow-50 transition">
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}
