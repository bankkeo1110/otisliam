'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { TOPICS } from '@/lib/questions';

interface Badge { topic: string; badge: string; bestScore: number; attempts: number; earnedAt: string; }
interface Answer { topic: string; question: string; correctAnswer: string; studentAnswer: string; isCorrect: boolean; answeredAt: string; }
interface Student { id: number; name: string; }

const BADGE_EMOJI: Record<string, string> = { bronze: '🥉', silver: '🥈', gold: '🥇', perfect: '👑' };
const BADGE_COLOR: Record<string, string> = {
  bronze: 'border-amber-400 bg-amber-50 text-amber-800',
  silver: 'border-gray-400 bg-gray-50 text-gray-700',
  gold: 'border-yellow-400 bg-yellow-50 text-yellow-800',
  perfect: 'border-purple-400 bg-purple-50 text-purple-800',
};
const BADGE_RANK: Record<string, number> = { bronze: 1, silver: 2, gold: 3, perfect: 4 };

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

function totalStars(badges: Badge[]): number {
  return badges.reduce((s, b) => s + BADGE_RANK[b.badge], 0);
}

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [recentAnswers, setRecentAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/students/${id}`)
      .then(r => {
        if (!r.ok) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then(data => {
        if (!data) return;
        setStudent(data.student);
        setBadges(data.badges);
        setRecentAnswers(data.recentAnswers);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="text-center py-20 text-2xl">Loading... ⏳</div>;
  if (notFound || !student) return (
    <div className="text-center py-20">
      <div className="text-6xl mb-4">🤔</div>
      <p className="text-xl text-gray-500">Student not found</p>
      <Link href="/members" className="mt-4 inline-block text-blue-500 underline">Back to Members</Link>
    </div>
  );

  const stars = totalStars(badges);
  const topicsCompleted = badges.length;
  const avgScore = badges.length ? Math.round(badges.reduce((s, b) => s + b.bestScore, 0) / badges.length) : 0;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-3xl shadow-lg p-8 mb-6 text-center">
        <div className="text-7xl mb-3">{avatarEmoji(badges)}</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-1">{student.name}</h1>
        <p className="text-gray-400 mb-6">Math Learner</p>
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
                className={`border-2 rounded-2xl p-4 transition ${badge ? BADGE_COLOR[badge.badge] : 'border-gray-200 bg-gray-50 opacity-60'}`}
              >
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
        <Link href={`/practice`} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full transition">
          🚀 Practice Now
        </Link>
        <Link href="/members" className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded-full transition">
          👥 All Members
        </Link>
      </div>
    </div>
  );
}
