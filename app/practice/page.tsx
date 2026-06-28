'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { generateQuestion, TOPICS, TOPIC_CATEGORIES, type Topic, type Question, type Category } from '@/lib/questions';

const CATEGORY_ORDER: Category[] = ['numbers', 'fractions', 'measurement-geometry', 'problem-solving'];

interface AuthUser { studentId: number; name: string; }
interface BadgeResult { badge: string; isNew: boolean; isUpgrade: boolean; previousBadge: string | null; }

const BADGE_EMOJI: Record<string, string> = { bronze: '🥉', silver: '🥈', gold: '🥇', perfect: '👑' };
const BADGE_LABEL: Record<string, string> = {
  bronze: 'Bronze Badge', silver: 'Silver Badge', gold: 'Gold Badge', perfect: 'Perfect Crown!',
};

const TARGET_POINTS = 100;
const POINTS_CORRECT = 2;
const POINTS_WRONG = 2;
const PROGRESS_KEY = 'mathapp_session_progress';

type Phase = 'setup' | 'playing' | 'result';

interface SavedProgress {
  topic: Topic;
  points: number;
  correctCount: number;
  totalAnswered: number;
  savedAt: number;
}

// ── Sound effects via Web Audio API ──────────────────────────────────────────

function playSound(correct: boolean) {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (correct) {
      // Cheerful ascending chime: C5 → E5 → G5
      [523, 659, 784].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        const t = ctx.currentTime + i * 0.12;
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.start(t);
        osc.stop(t + 0.3);
      });
    } else {
      // Sad descending "womp womp"
      [380, 260].forEach((startFreq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        const t = ctx.currentTime + i * 0.25;
        osc.frequency.setValueAtTime(startFreq, t);
        osc.frequency.exponentialRampToValueAtTime(startFreq * 0.55, t + 0.22);
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        osc.start(t);
        osc.stop(t + 0.22);
      });
    }
  } catch { /* audio not supported */ }
}

// ── Session progress persistence ──────────────────────────────────────────────

function saveProgress(topic: Topic, points: number, correctCount: number, totalAnswered: number) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ topic, points, correctCount, totalAnswered, savedAt: Date.now() }));
  } catch { /* ignore */ }
}

function loadProgress(topic: Topic): SavedProgress | null {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return null;
    const data: SavedProgress = JSON.parse(raw);
    if (data.topic !== topic) return null;
    if (Date.now() - data.savedAt > 24 * 60 * 60 * 1000) return null;
    if (data.points >= TARGET_POINTS) return null;
    return data;
  } catch { return null; }
}

function clearProgress() {
  try { localStorage.removeItem(PROGRESS_KEY); } catch { /* ignore */ }
}

// ── Component ─────────────────────────────────────────────────────────────────

function PracticeApp() {
  const searchParams = useSearchParams();
  const topicParam = searchParams.get('topic') as Topic | null;

  const [phase, setPhase] = useState<Phase>('setup');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic>(topicParam ?? 'addition');

  const [question, setQuestion] = useState<Question | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const [points, setPoints] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [earnedBadge, setEarnedBadge] = useState<BadgeResult | null>(null);

  const [flash, setFlash] = useState<{ val: string; key: number } | null>(null);
  const flashKey = useRef(0);

  const [savedProgress, setSavedProgress] = useState<SavedProgress | null>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setUser(d.user ?? null));
  }, []);

  useEffect(() => {
    setSavedProgress(loadProgress(selectedTopic));
  }, [selectedTopic]);

  const nextQuestion = useCallback(() => {
    setQuestion(generateQuestion(selectedTopic));
    setChosen(null);
    setIsCorrect(null);
  }, [selectedTopic]);

  const startGame = (forceNew = false) => {
    const saved = !forceNew ? savedProgress : null;
    if (saved) {
      setPoints(saved.points);
      setCorrectCount(saved.correctCount);
      setTotalAnswered(saved.totalAnswered);
    } else {
      setPoints(0);
      setCorrectCount(0);
      setTotalAnswered(0);
      clearProgress();
    }
    setEarnedBadge(null);
    setFlash(null);
    setPhase('playing');
    localStorage.setItem('mathapp_last_topic', selectedTopic);
    nextQuestion();
  };

  const handleAnswer = async (choice: string) => {
    if (chosen || !question) return;
    setChosen(choice);
    const correct = choice === question.answer;
    setIsCorrect(correct);

    const newTotal = totalAnswered + 1;
    const newCorrect = correctCount + (correct ? 1 : 0);
    const newPoints = Math.max(0, points + (correct ? POINTS_CORRECT : -POINTS_WRONG));

    setTotalAnswered(newTotal);
    setCorrectCount(newCorrect);
    setPoints(newPoints);

    playSound(correct);

    flashKey.current++;
    setFlash({ val: correct ? `+${POINTS_CORRECT}` : `-${POINTS_WRONG}`, key: flashKey.current });
    setTimeout(() => setFlash(null), 700);

    saveProgress(selectedTopic, newPoints, newCorrect, newTotal);

    if (user) {
      fetch('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: user.studentId,
          topic: selectedTopic,
          question: question.question,
          correctAnswer: question.answer,
          studentAnswer: choice,
          isCorrect: correct,
        }),
      });
    }

    setTimeout(async () => {
      if (newPoints >= TARGET_POINTS) {
        clearProgress();
        if (user) {
          try {
            const res = await fetch('/api/sessions/complete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                studentId: user.studentId,
                topic: selectedTopic,
                correct: newCorrect,
                total: newTotal,
              }),
            });
            setEarnedBadge(await res.json());
          } catch { /* silent */ }
        }
        setPhase('result');
      } else {
        nextQuestion();
      }
    }, 1800);
  };

  const topicInfo = TOPICS.find(t => t.id === selectedTopic)!;

  /* ── SETUP ── */
  if (phase === 'setup') {
    return (
      <div className="max-w-xl mx-auto">
        {user && (
          <div className="card-comic bg-[#4A6CF7] text-white rounded-2xl px-5 py-3 mb-5 flex items-center gap-3">
            <div className="text-2xl">👋</div>
            <div>
              <span className="font-black">Hey {user.name}!</span>
              <span className="text-blue-200 font-semibold text-sm ml-2">Ready to practice?</span>
            </div>
          </div>
        )}

        <h1 className="font-black text-3xl text-[#1a1a1a] mb-5 tracking-wide">🎯 CHOOSE A TOPIC</h1>

        <div className="card-comic bg-white rounded-2xl p-5 mb-5">
          <div className="space-y-4">
            {CATEGORY_ORDER.map(cat => {
              const catTopics = TOPICS.filter(t => t.category === cat);
              const catMeta = TOPIC_CATEGORIES[cat];
              return (
                <div key={cat}>
                  <div className="text-xs font-black tracking-widest text-gray-400 mb-2">{catMeta.emoji} {catMeta.label.toUpperCase()}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {catTopics.map(t => (
                      <button key={t.id} onClick={() => setSelectedTopic(t.id)}
                        className={`rounded-xl p-2.5 font-black text-left transition card-comic-sm text-sm ${
                          selectedTopic === t.id
                            ? `${t.color} border-[#1a1a1a]`
                            : 'bg-white border-gray-300 hover:border-[#1a1a1a]'
                        }`}>
                        <span>{t.emoji}</span>
                        <span className="ml-1.5">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card-comic-sm bg-blue-50 border-blue-300 rounded-2xl p-4 mb-5 text-sm font-semibold text-blue-700">
          🎮 Reach <strong>100 points</strong> to complete · ✅ Correct <strong>+{POINTS_CORRECT} pts</strong> · ❌ Wrong <strong>−{POINTS_WRONG} pts</strong>
        </div>

        {savedProgress ? (
          <div className="space-y-3">
            <div className="card-comic-sm bg-amber-50 border-amber-400 rounded-2xl p-4 text-sm font-bold text-amber-800">
              💾 Saved progress found: <strong>{savedProgress.points} pts</strong> · {savedProgress.correctCount}/{savedProgress.totalAnswered} correct
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => startGame(false)}
                className="card-comic bg-[#FFD015] text-[#1a1a1a] font-black py-4 rounded-2xl text-base hover:bg-yellow-300 transition">
                ▶ Resume
              </button>
              <button onClick={() => startGame(true)}
                className="card-comic bg-white text-[#1a1a1a] font-black py-4 rounded-2xl text-base hover:bg-gray-50 transition">
                🔄 New Game
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => startGame(false)}
            className="card-comic w-full bg-[#FFD015] text-[#1a1a1a] font-black py-4 rounded-2xl text-lg hover:bg-yellow-300 transition">
            ▶ START PRACTICE
          </button>
        )}
      </div>
    );
  }

  /* ── RESULT ── */
  if (phase === 'result') {
    const accuracy = totalAnswered ? Math.round((correctCount / totalAnswered) * 100) : 0;
    return (
      <div className="max-w-md mx-auto text-center">
        {earnedBadge && (earnedBadge.isNew || earnedBadge.isUpgrade) && (
          <div className={`card-comic rounded-2xl mb-4 p-5 animate-pop ${
            earnedBadge.badge === 'perfect' ? 'bg-purple-100 border-purple-500' :
            earnedBadge.badge === 'gold' ? 'bg-yellow-100 border-yellow-500' :
            earnedBadge.badge === 'silver' ? 'bg-gray-100 border-gray-400' : 'bg-amber-100 border-amber-500'
          }`}>
            <div className="text-6xl mb-1">{BADGE_EMOJI[earnedBadge.badge]}</div>
            <div className="font-black text-xl">
              {earnedBadge.isNew ? '🎉 NEW BADGE EARNED!' : '⬆️ BADGE UPGRADED!'}
            </div>
            <div className="font-semibold text-gray-600 mt-1">
              {earnedBadge.isUpgrade && earnedBadge.previousBadge ? `${BADGE_EMOJI[earnedBadge.previousBadge]} → ${BADGE_EMOJI[earnedBadge.badge]} ` : ''}
              {BADGE_LABEL[earnedBadge.badge]} · {topicInfo.emoji} {topicInfo.label}
            </div>
          </div>
        )}

        <div className="card-comic bg-white rounded-3xl p-8">
          <div className="text-7xl mb-3">🏆</div>
          <h1 className="font-black text-3xl mb-1 tracking-wide">COMPLETED!</h1>
          <p className="text-gray-400 font-bold mb-6">{topicInfo.emoji} {topicInfo.label}</p>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="card-comic-sm bg-green-50 border-green-400 rounded-xl p-3">
              <div className="font-black text-3xl text-green-600">{correctCount}</div>
              <div className="text-xs font-bold text-gray-500">CORRECT</div>
            </div>
            <div className="card-comic-sm bg-red-50 border-red-400 rounded-xl p-3">
              <div className="font-black text-3xl text-red-500">{totalAnswered - correctCount}</div>
              <div className="text-xs font-bold text-gray-500">WRONG</div>
            </div>
            <div className="card-comic-sm bg-blue-50 border-blue-400 rounded-xl p-3">
              <div className="font-black text-3xl text-blue-600">{accuracy}%</div>
              <div className="text-xs font-bold text-gray-500">ACCURACY</div>
            </div>
          </div>

          <p className="text-sm text-gray-400 font-semibold mb-6">{totalAnswered} questions answered</p>

          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={() => { setSavedProgress(null); startGame(true); }}
              className="card-comic-sm bg-[#FFD015] text-[#1a1a1a] font-black py-3 px-5 rounded-xl hover:bg-yellow-300 transition">
              🔄 Try Again
            </button>
            <Link href="/practice" className="card-comic-sm bg-white text-[#1a1a1a] font-black py-3 px-5 rounded-xl hover:bg-gray-50 transition">
              Change Topic
            </Link>
            {user && (
              <Link href={`/student/${user.studentId}`}
                className="card-comic-sm bg-[#4A6CF7] text-white font-black py-3 px-5 rounded-xl hover:opacity-90 transition">
                My Profile 🏅
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── PLAYING ── */
  const progressPct = Math.min(100, (points / TARGET_POINTS) * 100);

  return (
    <div className="max-w-xl mx-auto relative">
      {flash && (
        <div key={flash.key}
          className={`absolute top-0 right-0 font-black text-3xl pointer-events-none animate-flash z-10 ${
            flash.val.startsWith('+') ? 'text-green-500' : 'text-red-500'
          }`}>
          {flash.val}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setPhase('setup')}
          className="card-comic-sm bg-white font-black text-sm px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
          ← Back
        </button>
        <span className={`card-comic-sm px-3 py-1 rounded-full font-black text-sm ${topicInfo.color}`}>
          {topicInfo.emoji} {topicInfo.label}
        </span>
        <span className="font-black text-sm text-gray-500">✅ {correctCount} ❌ {totalAnswered - correctCount}</span>
      </div>

      <div className="card-comic bg-white rounded-2xl p-4 mb-5">
        <div className="flex justify-between items-baseline mb-2">
          <span className="font-black text-4xl text-[#1a1a1a]">{points}</span>
          <span className="font-bold text-gray-400">/ {TARGET_POINTS} pts</span>
        </div>
        <div className="h-4 bg-gray-100 rounded-full border-2 border-[#1a1a1a] overflow-hidden">
          <div className="h-full bg-[#FFD015] rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="mt-1 text-right text-xs font-bold text-gray-400">{Math.round(progressPct)}% to goal</div>
      </div>

      {question && (
        <div className="card-comic bg-white rounded-2xl p-7 mb-4">
          <p className="font-black text-2xl text-center text-[#1a1a1a] mb-8 leading-snug">{question.question}</p>
          <div className="grid grid-cols-2 gap-3">
            {question.choices.map(c => {
              let cls = 'card-comic-sm border-[#1a1a1a] bg-white hover:bg-yellow-50 hover:border-yellow-400';
              if (chosen) {
                if (c === question.answer) cls = 'border-green-500 bg-green-100 shadow-[3px_3px_0px_#16a34a]';
                else if (c === chosen) cls = 'border-red-400 bg-red-100 shadow-[3px_3px_0px_#ef4444]';
                else cls = 'border-gray-200 bg-gray-50 opacity-50';
              }
              return (
                <button key={c} onClick={() => handleAnswer(c)} disabled={!!chosen}
                  className={`${cls} rounded-xl py-5 font-black text-xl transition text-center border-2`}>
                  {c}
                </button>
              );
            })}
          </div>

          {chosen && (
            <div className="mt-5">
              <div className={`text-center font-black text-lg ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                {isCorrect ? '✅ Correct! Great job!' : `❌ Wrong! The answer is ${question.answer}`}
              </div>
              {!isCorrect && question.explanation && (
                <div className="mt-3 bg-yellow-50 border-2 border-yellow-300 rounded-xl p-3 text-sm font-semibold text-gray-700 text-left">
                  💡 <span className="font-black text-gray-800">How to find it:</span> {question.explanation}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {points >= 60 && points < TARGET_POINTS && (
        <div className="text-center font-black text-gray-400 text-sm animate-pulse">
          Almost there! {TARGET_POINTS - points} pts to go 🔥
        </div>
      )}
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={<div className="text-center py-20 font-black text-2xl">Loading... ⏳</div>}>
      <PracticeApp />
    </Suspense>
  );
}
