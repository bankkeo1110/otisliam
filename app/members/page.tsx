'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TOPICS } from '@/lib/questions';

interface Badge { topic: string; badge: string; bestScore: number; attempts: number; }
interface Student { id: number; name: string; }
interface MemberData { student: Student; badges: Badge[]; }

const BADGE_EMOJI: Record<string, string> = { bronze: '🥉', silver: '🥈', gold: '🥇', perfect: '👑' };
const BADGE_RANK: Record<string, number> = { bronze: 1, silver: 2, gold: 3, perfect: 4 };

function topBadge(badges: Badge[]): string {
  if (!badges.length) return '';
  return badges.reduce((top, b) => BADGE_RANK[b.badge] > BADGE_RANK[top.badge] ? b : top).badge;
}

function avatarEmoji(badges: Badge[]): string {
  const count = badges.length;
  const hasPerfect = badges.some(b => b.badge === 'perfect');
  const hasGold = badges.some(b => b.badge === 'gold');
  if (hasPerfect || count === 6) return '🦸';
  if (hasGold || count >= 4) return '⭐';
  if (count >= 2) return '😊';
  if (count >= 1) return '🌱';
  return '🐣';
}

export default function MembersPage() {
  const [members, setMembers] = useState<MemberData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/students');
      const studentList: Student[] = await res.json();
      const all = await Promise.all(
        studentList.map(async (s) => {
          const r = await fetch(`/api/students/${s.id}`);
          const data = await r.json();
          return { student: s, badges: data.badges ?? [] };
        })
      );
      setMembers(all);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="text-center py-20 text-2xl">Loading members... ⏳</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-blue-700 mb-2">🏅 Members</h1>
        <p className="text-gray-500">See everyone&apos;s progress and badges</p>
      </div>

      {members.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl shadow">
          <div className="text-6xl mb-4">🐣</div>
          <p className="text-xl text-gray-500 mb-4">No members yet!</p>
          <Link href="/practice" className="bg-blue-500 text-white font-bold py-3 px-8 rounded-full hover:bg-blue-600 transition">
            Start Practicing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {members.map(({ student, badges }) => {
            const top = topBadge(badges);
            const avatar = avatarEmoji(badges);
            const totalAttempts = badges.reduce((s, b) => s + b.attempts, 0);
            return (
              <Link key={student.id} href={`/student/${student.id}`}
                className="bg-white rounded-2xl shadow hover:shadow-lg hover:-translate-y-1 transition-all p-5 flex flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{avatar}</div>
                  <div>
                    <div className="font-bold text-lg text-gray-800">{student.name}</div>
                    <div className="text-sm text-gray-400">{totalAttempts} quiz{totalAttempts !== 1 ? 'zes' : ''} done</div>
                  </div>
                </div>

                {/* topic badge strip */}
                <div className="flex gap-1 flex-wrap">
                  {TOPICS.map(t => {
                    const b = badges.find(x => x.topic === t.id);
                    return (
                      <span key={t.id} title={`${t.label}${b ? ` — ${BADGE_EMOJI[b.badge]} ${b.badge} (${b.bestScore}%)` : ' — not tried yet'}`}
                        className={`text-xl ${b ? '' : 'opacity-20'}`}>
                        {b ? BADGE_EMOJI[b.badge] : t.emoji}
                      </span>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{badges.length}/6 topics</span>
                  {top && <span className="font-semibold text-gray-600">Best: {BADGE_EMOJI[top]} {top}</span>}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="mt-8 text-center">
        <Link href="/practice" className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full transition">
          🚀 Start Practicing
        </Link>
      </div>
    </div>
  );
}
