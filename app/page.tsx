'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TOPICS, TOPIC_CATEGORIES, type Category } from '@/lib/questions';

interface Badge { topic: string; badge: string; bestScore: number; attempts: number; }

const BADGE_EMOJI: Record<string, string> = { bronze: '🥉', silver: '🥈', gold: '🥇', perfect: '👑' };

const CATEGORY_ORDER: Category[] = ['numbers', 'fractions', 'measurement-geometry', 'problem-solving'];

export default function Home() {
  const [studentId, setStudentId] = useState<number | null>(null);
  const [studentName, setStudentName] = useState<string | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [lastTopic, setLastTopic] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem('mathapp_student_id');
    const name = localStorage.getItem('mathapp_student_name');
    const topic = localStorage.getItem('mathapp_last_topic');
    if (id && name) {
      setStudentId(parseInt(id));
      setStudentName(name);
      setLastTopic(topic);
      fetch(`/api/students/${id}`)
        .then(r => r.json())
        .then(data => {
          setBadges(data.badges ?? []);
          if (!topic && data.recentAnswers?.length) {
            setLastTopic(data.recentAnswers[0]?.topic ?? null);
          }
        });
    }
  }, []);

  const lastTopicInfo = TOPICS.find(t => t.id === lastTopic);
  const topicsDone = badges.length;
  const totalTopics = TOPICS.length;

  const greetings = ['POW!', 'WOW!', 'YO!', 'HEY!'];
  const greeting = studentName ? greetings[studentName.charCodeAt(0) % greetings.length] : 'HEY!';

  return (
    <div className="max-w-4xl mx-auto">

      {/* Row 1 — greeting + counter */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="card-comic bg-white rounded-2xl p-5 max-w-sm">
          <h2 className="font-black text-2xl text-[#1a1a1a]">
            {studentName ? `${greeting} Hey ${studentName} 🧮` : 'Welcome to Math Fun! 🧮'}
          </h2>
          <p className="text-gray-500 mt-1 font-semibold">Time to power up your brain.</p>
        </div>
        <div className="card-comic bg-green-500 text-white font-black text-center px-7 py-3 rounded-2xl shrink-0">
          <div className="text-4xl leading-none">{topicsDone}/{totalTopics}</div>
          <div className="text-xs tracking-[0.15em] mt-1">TOPICS DONE</div>
        </div>
      </div>

      {/* Row 2 — Continue + Daily Quiz */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <div className="card-comic bg-[#4A6CF7] text-white rounded-2xl p-6 flex flex-col justify-between min-h-[180px]">
          {lastTopicInfo ? (
            <>
              <div>
                <span className="bg-[#FFD015] text-[#1a1a1a] font-black text-xs px-3 py-1 rounded-full uppercase tracking-wide">
                  Continue · Math
                </span>
                <h3 className="font-black text-2xl mt-3 mb-1">{lastTopicInfo.emoji} {lastTopicInfo.label}</h3>
                {(() => { const b = badges.find(x => x.topic === lastTopic); return <p className="text-blue-200 text-sm">{b ? `Best: ${b.bestScore}% · ${BADGE_EMOJI[b.badge]} ${b.badge}` : 'Not completed yet'}</p>; })()}
              </div>
              <Link href={`/practice?topic=${lastTopic}`} className="mt-4 bg-[#FFD015] text-[#1a1a1a] font-black px-5 py-2.5 rounded-xl inline-flex items-center gap-2 hover:bg-yellow-300 transition w-fit">
                ▶ RESUME
              </Link>
            </>
          ) : (
            <>
              <div>
                <span className="bg-[#FFD015] text-[#1a1a1a] font-black text-xs px-3 py-1 rounded-full">START HERE</span>
                <h3 className="font-black text-2xl mt-3 mb-1">🚀 Let&apos;s Begin!</h3>
                <p className="text-blue-200 text-sm">Pick a topic below and start earning badges</p>
              </div>
              <Link href="/practice" className="mt-4 bg-[#FFD015] text-[#1a1a1a] font-black px-5 py-2.5 rounded-xl inline-flex items-center gap-2 hover:bg-yellow-300 transition w-fit">
                ▶ START
              </Link>
            </>
          )}
        </div>

        <div className="card-comic bg-[#E85555] text-white rounded-2xl p-6 flex flex-col justify-between min-h-[180px]">
          <div>
            <h3 className="font-black text-2xl mb-2 tracking-wide">DAILY QUIZ</h3>
            <p className="text-red-100 font-semibold">Mix of all topics. Beat your best score!</p>
          </div>
          <Link href="/practice" className="mt-4 border-2 border-white text-white font-black px-5 py-2.5 rounded-xl inline-flex items-center gap-2 hover:bg-white hover:text-[#E85555] transition w-fit">
            START →
          </Link>
        </div>
      </div>

      {/* Topics by category */}
      {CATEGORY_ORDER.map(cat => {
        const catTopics = TOPICS.filter(t => t.category === cat);
        const catMeta = TOPIC_CATEGORIES[cat];
        return (
          <div key={cat} className="mb-8">
            <h2 className="font-black text-xs tracking-[0.2em] text-[#1a1a1a] mb-3 flex items-center gap-2">
              <span>{catMeta.emoji}</span>
              <span>{catMeta.label.toUpperCase()}</span>
              <span className="text-gray-400 font-bold">
                ({catTopics.filter(t => badges.some(b => b.topic === t.id)).length}/{catTopics.length} done)
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {catTopics.map(t => {
                const badge = badges.find(b => b.topic === t.id);
                const pct = badge?.bestScore ?? 0;
                const barColor = pct >= 90 ? 'bg-green-500' : pct >= 70 ? 'bg-yellow-400' : 'bg-blue-400';
                return (
                  <Link key={t.id} href={`/practice?topic=${t.id}`}
                    className="card-comic bg-white rounded-2xl p-4 flex items-center gap-3 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#1a1a1a] transition-all">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl border-2 border-[#1a1a1a] shrink-0 ${t.color}`}>
                      {t.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <span className="font-black text-sm text-[#1a1a1a]">{t.label}</span>
                        <span className={`font-black text-xs ml-1 shrink-0 ${pct ? 'text-green-600' : 'text-gray-300'}`}>
                          {pct ? `${pct}%` : '--'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 font-semibold mb-1.5 truncate">{t.description}</div>
                      <div className="h-2 bg-gray-100 rounded-full border border-gray-200 overflow-hidden">
                        <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                      {badge && (
                        <div className="text-xs text-gray-400 mt-0.5">{BADGE_EMOJI[badge.badge]} {badge.badge} · {badge.attempts} attempt{badge.attempts !== 1 ? 's' : ''}</div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}

      {!studentId && (
        <div className="mt-2 card-comic bg-[#FFD015] rounded-2xl p-5 text-center">
          <p className="font-black text-lg mb-3">Select your name in Practice to track progress! 👆</p>
          <Link href="/practice" className="card-comic-sm bg-[#1a1a1a] text-white font-black px-8 py-3 rounded-xl inline-block hover:opacity-90 transition">
            Go to Practice →
          </Link>
        </div>
      )}
    </div>
  );
}
