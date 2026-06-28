'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { TOPICS } from '@/lib/questions';

interface Badge { topic: string; badge: string; bestScore: number; attempts: number; earnedAt: string; }
interface Answer { topic: string; question: string; correctAnswer: string; studentAnswer: string; isCorrect: boolean; answeredAt: string; }
interface Student { id: number; name: string; avatar?: string | null; }

const BADGE_EMOJI: Record<string, string> = { bronze: '🥉', silver: '🥈', gold: '🥇', perfect: '👑' };
const BADGE_COLOR: Record<string, string> = {
  bronze: 'border-amber-400 bg-amber-50 text-amber-800',
  silver: 'border-gray-400 bg-gray-50 text-gray-700',
  gold: 'border-yellow-400 bg-yellow-50 text-yellow-800',
  perfect: 'border-purple-400 bg-purple-50 text-purple-800',
};
const BADGE_RANK: Record<string, number> = { bronze: 1, silver: 2, gold: 3, perfect: 4 };

export const AVATARS = [
  '🦁','🐯','🐻','🐼','🦊','🐺',
  '🦄','🐲','🦈','🐙','🦋','🐸',
  '🦅','🦉','🦜','🐬','🐒','🐘',
  '🦒','🦓','🦝','🦩','🦚','👾',
];

function defaultAvatar(badges: Badge[]): string {
  const count = badges.length;
  const hasPerfect = badges.some(b => b.badge === 'perfect');
  const hasGold = badges.some(b => b.badge === 'gold');
  if (hasPerfect || count === 6) return '🦸';
  if (hasGold || count >= 4) return '⭐';
  if (count >= 2) return '😊';
  if (count >= 1) return '🌱';
  return '🐣';
}

function totalStars(badges: Badge[]): number {
  return badges.reduce((s, b) => s + BADGE_RANK[b.badge], 0);
}

function AvatarPicker({ current, onSelect, onClose }: {
  current: string | null;
  onSelect: (a: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-sm"
        onClick={e => e.stopPropagation()}>
        <h3 className="text-2xl font-black text-gray-800 mb-1 text-center">Pick your avatar!</h3>
        <p className="text-sm text-gray-400 text-center mb-4">Choose an animal or character</p>
        <div className="grid grid-cols-6 gap-2">
          {AVATARS.map(a => (
            <button key={a} onClick={() => onSelect(a)}
              className={`text-3xl w-11 h-11 rounded-xl transition-all flex items-center justify-center
                ${current === a
                  ? 'bg-blue-100 ring-2 ring-blue-500 scale-110'
                  : 'hover:bg-gray-100 hover:scale-110 active:scale-95'}`}>
              {a}
            </button>
          ))}
        </div>
        <button onClick={onClose}
          className="mt-5 w-full py-2 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition">
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [recentAnswers, setRecentAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [myId, setMyId] = useState<number | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/students/${id}`)
      .then(r => {
        if (!r.ok) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then(data => {
        if (!data) return;
        setStudent(data.student);
        setAvatar(data.student.avatar ?? null);
        setBadges(data.badges);
        setRecentAnswers(data.recentAnswers);
        setLoading(false);
      });
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      setMyId(d.user?.studentId ?? null);
    });
  }, [id]);

  const handleSelectAvatar = async (a: string) => {
    setAvatar(a);
    setShowPicker(false);
    setSaving(true);
    await fetch('/api/profile/avatar', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ avatar: a }) });
    setSaving(false);
    window.dispatchEvent(new Event('mathapp_student_changed'));
  };

  if (loading) return <div className="text-center py-20 text-2xl">Loading... ⏳</div>;
  if (notFound || !student) return (
    <div className="text-center py-20">
      <div className="text-6xl mb-4">🤔</div>
      <p className="text-xl text-gray-500">Student not found</p>
      <Link href="/members" className="mt-4 inline-block text-blue-500 underline">Back to Members</Link>
    </div>
  );

  const isOwn = myId !== null && myId === parseInt(id);
  const displayAvatar = avatar ?? defaultAvatar(badges);
  const stars = totalStars(badges);
  const topicsCompleted = badges.length;
  const avgScore = badges.length ? Math.round(badges.reduce((s, b) => s + b.bestScore, 0) / badges.length) : 0;

  return (
    <div className="max-w-2xl mx-auto">
      {showPicker && (
        <AvatarPicker current={avatar} onSelect={handleSelectAvatar} onClose={() => setShowPicker(false)} />
      )}

      {/* Header */}
      <div className="bg-white rounded-3xl shadow-lg p-8 mb-6 text-center">
        <div className="relative inline-block mb-3">
          <div className="text-7xl">{displayAvatar}</div>
          {isOwn && (
            <button onClick={() => setShowPicker(true)}
              className="absolute -bottom-1 -right-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-black w-7 h-7 rounded-full flex items-center justify-center shadow-md transition"
              title="Change avatar">
              ✏️
            </button>
          )}
        </div>
        {saving && <div className="text-xs text-blue-400 mb-1">Saving...</div>}
        <h1 className="text-3xl font-bold text-gray-800 mb-1">{student.name}</h1>
        <p className="text-gray-400 mb-6">Math Learner</p>
        {isOwn && (
          <button onClick={() => setShowPicker(true)}
            className="mb-4 text-sm text-blue-500 font-semibold hover:text-blue-700 transition">
            🎨 Change avatar
          </button>
        )}
        <div className="flex justify-center gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{topicsCompleted}/6</div>
            <div className="text-sm text-gray-400">Topics done</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-500">{stars}⭐</div>
            <div className="text-sm text-gray-400">Total stars</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{avgScore}%</div>
            <div className="text-sm text-gray-400">Avg best score</div>
          </div>
        </div>
      </div>

      {/* Topic badges */}
      <div className="bg-white rounded-3xl shadow p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-700 mb-4">🎖️ Topic Badges</h2>
        <div className="grid grid-cols-2 gap-3">
          {TOPICS.map(t => {
            const badge = badges.find(b => b.topic === t.id);
            return (
              <div key={t.id}
                className={`border-2 rounded-2xl p-4 transition ${badge ? BADGE_COLOR[badge.badge] : 'border-gray-200 bg-gray-50 opacity-60'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{t.emoji}</span>
                  <span className="font-bold">{t.label}</span>
                  {badge && <span className="ml-auto text-2xl">{BADGE_EMOJI[badge.badge]}</span>}
                  {!badge && <span className="ml-auto text-xl">🔒</span>}
                </div>
                {badge ? (
                  <div className="text-sm">
                    <span className="font-semibold">{badge.badge.charAt(0).toUpperCase() + badge.badge.slice(1)}</span>
                    <span className="mx-1">·</span>
                    <span>Best: {badge.bestScore}%</span>
                    <span className="mx-1">·</span>
                    <span>{badge.attempts} attempt{badge.attempts !== 1 ? 's' : ''}</span>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">Not tried yet</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Badge legend */}
      <div className="bg-white rounded-2xl shadow p-4 mb-6">
        <h3 className="font-bold text-gray-600 mb-2 text-sm">Badge Guide</h3>
        <div className="flex gap-4 flex-wrap text-sm">
          <span>🥉 Bronze — completed</span>
          <span>🥈 Silver — 70%+</span>
          <span>🥇 Gold — 90%+</span>
          <span>👑 Perfect — 100%</span>
        </div>
      </div>

      {/* Recent activity */}
      {recentAnswers.length > 0 && (
        <div className="bg-white rounded-3xl shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-700 mb-4">📋 Recent Activity</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recentAnswers.map((a, i) => {
              const topic = TOPICS.find(t => t.id === a.topic);
              return (
                <div key={i} className={`flex items-center gap-3 p-2 rounded-xl text-sm ${a.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                  <span>{topic?.emoji ?? '📖'}</span>
                  <span className="flex-1 truncate text-gray-700">{a.question}</span>
                  <span className={`font-bold ${a.isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                    {a.isCorrect ? '✅' : `❌ ${a.correctAnswer}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-center">
        <Link href="/practice" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full transition">
          🚀 Practice Now
        </Link>
        <Link href="/members" className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded-full transition">
          👥 All Members
        </Link>
      </div>
    </div>
  );
}
