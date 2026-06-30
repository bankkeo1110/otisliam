'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { GROWTH_QUESTIONS, CATEGORIES, type GrowthQuestion, type Difficulty } from '@/lib/growth-questions';
import { WHY_STUDY_QUESTIONS, type WhyStudyQuestion } from '@/lib/why-study-questions';

type Slot = 'good-result' | 'bad-result' | null;
type Assignment = { good: Slot; bad: Slot };
type CardKey = 'good' | 'bad';
type Zone = 'good-result' | 'bad-result';
type Phase = 'splash' | 'why-study' | 'why-done' | 'intro' | 'playing' | 'done';

const SESSION_SIZE = 20;
const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard', 'very hard'];

// ── Image keywords (keyword sets cycled by question ID for variety) ─────────
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Money & Buying': [
    'piggybank,coins,child',
    'children,saving,money',
    'kids,shopping,store',
    'wallet,allowance,child',
    'bank,saving,coins',
    'money,jar,kid',
    'coins,counting,child',
    'kids,budget,home',
  ],
  'Health & Energy': [
    'children,exercise,sport',
    'kids,running,outdoor',
    'healthy,vegetables,food',
    'children,sleep,rest',
    'kids,sports,active',
    'child,eating,healthy',
    'children,fitness,play',
    'fruit,vegetables,colorful',
  ],
  'Friendships & Respect': [
    'children,friendship,play',
    'kids,teamwork,school',
    'children,kindness,share',
    'school,friends,laughing',
    'kids,helping,together',
    'children,playing,outdoor',
    'friends,hands,together',
    'kids,cooperation,team',
  ],
  'Skills & Creativity': [
    'child,drawing,art',
    'kids,music,instrument',
    'child,reading,book',
    'children,science,experiment',
    'kids,creativity,craft',
    'child,coding,computer',
    'children,learning,school',
    'kids,building,blocks',
  ],
  'Your Amazing Future': [
    'graduation,student,success',
    'child,studying,desk',
    'kids,dream,future',
    'student,learning,book',
    'education,achievement,school',
    'children,goals,success',
    'study,focus,desk',
    'kids,science,future',
  ],
};

function getQuestionImageUrl(q: GrowthQuestion): string {
  const keywords = CATEGORY_KEYWORDS[q.category] ?? ['learning,kids,school'];
  const kw = keywords[q.id % keywords.length];
  return `https://loremflickr.com/600/280/${kw}?lock=${q.id}`;
}

// ── Per-question image with loading placeholder and error fallback ───────────
function QuestionImage({ q }: { q: GrowthQuestion }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const meta = CATEGORY_META[q.category] ?? { bg: 'bg-gray-50', emoji: '📚', color: 'text-gray-500', border: 'border-gray-200' };

  return (
    <div className="relative w-full h-44 rounded-xl overflow-hidden mb-4 border-2 border-gray-100 bg-gray-50">
      {/* Placeholder shown while loading or on error */}
      <div className={`absolute inset-0 ${meta.bg} flex flex-col items-center justify-center transition-opacity duration-300 ${loaded && !error ? 'opacity-0' : 'opacity-100'}`}>
        <span className={`text-5xl ${!loaded && !error ? 'animate-pulse' : ''}`}>{q.emoji}</span>
        {error && <span className="text-xs font-bold text-gray-400 mt-2">{q.category}</span>}
      </div>
      {!error && (
        <img
          key={q.id}
          src={getQuestionImageUrl(q)}
          alt={q.category}
          className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
          onError={() => { setError(true); setLoaded(false); }}
        />
      )}
      {/* Category label overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-3 py-2 flex items-center gap-1">
        <span className="text-sm">{q.emoji}</span>
        <span className="text-xs font-black text-white tracking-wide">{q.category}</span>
        <span className="ml-auto text-xs font-bold text-white/70 uppercase">{q.difficulty}</span>
      </div>
    </div>
  );
}

const CATEGORY_META: Record<string, { emoji: string; color: string; bg: string; border: string }> = {
  'Money & Buying':        { emoji: '💰', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-400' },
  'Health & Energy':       { emoji: '💪', color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-400' },
  'Friendships & Respect': { emoji: '🤝', color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-400' },
  'Skills & Creativity':   { emoji: '🎨', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-400' },
  'Your Amazing Future':   { emoji: '🚀', color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-400' },
};

function posKey(category: string) {
  return `grow_pos_${category}`;
}

function getSessionQuestions(category: string): GrowthQuestion[] {
  const catQs = GROWTH_QUESTIONS
    .filter(q => q.category === category)
    .sort((a, b) => DIFFICULTY_ORDER.indexOf(a.difficulty) - DIFFICULTY_ORDER.indexOf(b.difficulty));
  const raw = typeof window !== 'undefined' ? localStorage.getItem(posKey(category)) : null;
  const pos = raw ? parseInt(raw, 10) : 0;
  const session = catQs.slice(pos, pos + SESSION_SIZE);
  if (session.length === 0) {
    return catQs.slice(0, SESSION_SIZE);
  }
  return session;
}

function advancePosition(category: string, sessionLength: number) {
  const catTotal = GROWTH_QUESTIONS.filter(q => q.category === category).length;
  const raw = typeof window !== 'undefined' ? localStorage.getItem(posKey(category)) : null;
  const pos = raw ? parseInt(raw, 10) : 0;
  const next = pos + sessionLength;
  if (next >= catTotal) {
    localStorage.removeItem(posKey(category));
  } else {
    localStorage.setItem(posKey(category), String(next));
  }
}

function getCategoryProgress(category: string): { done: number; total: number } {
  const total = GROWTH_QUESTIONS.filter(q => q.category === category).length;
  const raw = typeof window !== 'undefined' ? localStorage.getItem(posKey(category)) : null;
  const done = raw ? parseInt(raw, 10) : 0;
  return { done, total };
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-1">
        <span className="font-black text-sm text-gray-500">{current} / {total} activities</span>
        <span className="font-black text-sm text-[#4A6CF7]">{pct}% complete</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full border-2 border-[#1a1a1a] overflow-hidden">
        <div className="h-full bg-[#4A6CF7] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Result-zone image (used inside Why Study lesson) ───────────────────────
function ResultImage({ keyword, id, seed }: { keyword: string; id: number; seed: number }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const src = `https://loremflickr.com/480/200/${keyword}?lock=${id * 10 + seed}`;
  return (
    <div className="relative w-full h-32 rounded-xl overflow-hidden bg-gray-100 mb-2">
      {!loaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl animate-pulse">🖼️</span>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <span className="text-3xl">🖼️</span>
        </div>
      )}
      {!error && (
        <img
          key={src}
          src={src}
          alt=""
          className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      )}
    </div>
  );
}

// ── Standalone "Why You Must Study" lesson (30 questions) ──────────────────
function WhyStudyLesson({ onBack, onAllTopics }: { onBack: () => void; onAllTopics: () => void }) {
  const [wsIdx, setWsIdx] = useState(0);
  const [wsScore, setWsScore] = useState(0);
  const [wsDone, setWsDone] = useState(false);

  const [order, setOrder] = useState<[CardKey, CardKey]>(['good', 'bad']);
  const [selected, setSelected] = useState<CardKey | null>(null);
  const [assignment, setAssignment] = useState<Assignment>({ good: null, bad: null });
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [dragging, setDragging] = useState<CardKey | null>(null);
  const [dragOver, setDragOver] = useState<Zone | null>(null);

  const q: WhyStudyQuestion = WHY_STUDY_QUESTIONS[wsIdx];
  const total = WHY_STUDY_QUESTIONS.length;

  const reset = useCallback(() => {
    setOrder(Math.random() > 0.5 ? ['good', 'bad'] : ['bad', 'good']);
    setSelected(null);
    setAssignment({ good: null, bad: null });
    setChecked(false);
    setCorrect(null);
    setDragging(null);
    setDragOver(null);
  }, []);

  useEffect(() => { reset(); }, [wsIdx, reset]);

  if (wsDone) {
    const pct = Math.round((wsScore / total) * 100);
    const msg = pct === 100 ? '🏆 PERFECT! You know exactly why studying matters!'
      : pct >= 80 ? '🌟 Excellent! You have a great understanding of your future!'
      : pct >= 60 ? '👍 Good job! Keep thinking about your choices every day.'
      : '💪 Keep going! Every lesson makes you wiser about your future.';
    return (
      <div className="max-w-xl mx-auto text-center">
        <div className="card-comic bg-white rounded-3xl p-8">
          <div className="text-7xl mb-4">{pct === 100 ? '🏆' : pct >= 80 ? '🌟' : '📚'}</div>
          <h1 className="font-black text-3xl text-[#1a1a1a] mb-2">LESSON COMPLETE!</h1>
          <p className="font-bold text-gray-500 mb-6">Why You Must Study</p>
          <div className="card-comic-sm bg-[#4A6CF7] text-white rounded-2xl p-5 mb-6">
            <div className="font-black text-5xl mb-1">{wsScore}/{total}</div>
            <div className="font-bold text-blue-200">{pct}% correct</div>
          </div>
          <p className="font-black text-lg text-[#1a1a1a] mb-8">{msg}</p>
          <div className="card-comic-sm bg-[#FFF9C4] border-yellow-400 rounded-2xl p-5 mb-8 text-left">
            <p className="font-black text-green-700 mb-2">🌱 Remember always:</p>
            <p className="text-sm font-semibold text-gray-700">
              Every hour you spend studying today is an investment in the life you want tomorrow.
              The choices you make right now shape who you will become.{' '}
              <strong>You have the power to build your amazing future — starting right now.</strong>
            </p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={() => { setWsIdx(0); setWsScore(0); setWsDone(false); }}
              className="card-comic-sm bg-[#4A6CF7] text-white font-black py-3 px-6 rounded-xl hover:opacity-90 transition">
              🔄 Try Again
            </button>
            <button onClick={onAllTopics}
              className="card-comic-sm bg-[#FFD015] text-[#1a1a1a] font-black py-3 px-6 rounded-xl hover:bg-yellow-300 transition">
              🌱 All Topics
            </button>
            <Link href="/" className="card-comic-sm bg-white text-[#1a1a1a] font-black py-3 px-6 rounded-xl hover:bg-gray-50 transition">
              🏠 Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const assignCard = (card: CardKey, zone: Zone) => {
    if (checked) return;
    setAssignment(prev => {
      const next = { ...prev };
      if (next.good === zone) next.good = null;
      if (next.bad === zone) next.bad = null;
      next[card] = zone;
      return next;
    });
    setSelected(null);
  };

  const handleCardClick = (card: CardKey) => {
    if (checked || assignment[card] !== null) return;
    setSelected(prev => (prev === card ? null : card));
  };
  const handleZoneClick = (zone: Zone) => {
    if (checked || !selected) return;
    assignCard(selected, zone);
  };
  const onDragStart = (e: React.DragEvent, card: CardKey) => {
    e.dataTransfer.setData('card', card);
    e.dataTransfer.effectAllowed = 'move';
    setDragging(card); setSelected(null);
  };
  const onDragEnd = () => { setDragging(null); setDragOver(null); };
  const onDragOver = (e: React.DragEvent, zone: Zone) => {
    e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOver(zone);
  };
  const onDragLeave = (e: React.DragEvent) => {
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) setDragOver(null);
  };
  const onDrop = (e: React.DragEvent, zone: Zone) => {
    e.preventDefault();
    const card = e.dataTransfer.getData('card') as CardKey;
    if (card === 'good' || card === 'bad') assignCard(card, zone);
    setDragging(null); setDragOver(null);
  };

  const canCheck = assignment.good !== null && assignment.bad !== null;
  const cardInZone = (zone: Zone): CardKey | null => {
    if (assignment.good === zone) return 'good';
    if (assignment.bad === zone) return 'bad';
    return null;
  };
  const actionText = (card: CardKey) => card === 'good' ? q.goodAction : q.badAction;

  const handleCheck = () => {
    if (!canCheck) return;
    const isCorrect = assignment.good === 'good-result' && assignment.bad === 'bad-result';
    setCorrect(isCorrect);
    setChecked(true);
    if (isCorrect) setWsScore(s => s + 1);
  };
  const handleNext = () => {
    if (wsIdx + 1 >= total) setWsDone(true);
    else setWsIdx(i => i + 1);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-1">
          <span className="font-black text-sm text-gray-500">{wsIdx} / {total} situations</span>
          <span className="font-black text-sm text-[#4A6CF7]">{Math.round((wsIdx / total) * 100)}% complete</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full border-2 border-[#1a1a1a] overflow-hidden">
          <div className="h-full bg-[#4A6CF7] rounded-full transition-all duration-500" style={{ width: `${(wsIdx / total) * 100}%` }} />
        </div>
      </div>

      <div className="card-comic bg-white rounded-2xl p-5 mb-4">
        {/* Situation header */}
        <div className="flex items-center justify-between mb-4">
          <span className="card-comic-sm px-3 py-1 bg-[#FFF9C4] border-yellow-400 rounded-full font-black text-sm">
            {q.situation}
          </span>
          <span className="font-black text-sm text-gray-500">⭐ {wsScore} correct</span>
        </div>

        <p className="font-black text-xl text-center text-[#1a1a1a] mb-2">
          What happens when you make these choices?
        </p>
        <p className="text-sm font-semibold text-center text-gray-400 mb-5 min-h-[20px]">
          {!checked && !dragging && !selected && '🖱️ Drag a card — or tap to select, then tap a zone'}
          {!checked && dragging && '📦 Drop it on the correct outcome →'}
          {!checked && selected && !dragging && '👆 Now tap a result zone →'}
          {checked && correct && '🎉 Perfect match!'}
          {checked && correct === false && '❌ Not quite — see the correct answer below'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* ── LEFT: Action cards ──────────────────────────────────── */}
          <div className="space-y-3">
            <p className="font-black text-xs tracking-widest text-gray-400 text-center">YOUR CHOICE</p>
            {order.map(card => {
              const assigned = assignment[card] !== null;
              const isSelected = selected === card;
              const isDraggingThis = dragging === card;
              let cls = 'w-full rounded-2xl border-2 p-5 text-left font-bold text-base leading-snug transition select-none ';
              if (checked)           cls += 'bg-gray-100 border-gray-200 opacity-50 cursor-default';
              else if (assigned)     cls += 'bg-gray-50 border-gray-200 opacity-40 cursor-default';
              else if (isDraggingThis) cls += 'bg-[#4A6CF7] text-white border-[#4A6CF7] opacity-50 cursor-grabbing scale-95';
              else if (isSelected)   cls += 'bg-[#4A6CF7] text-white border-[#4A6CF7] shadow-[0_0_0_4px_rgba(74,108,247,0.35)] cursor-pointer';
              else                   cls += 'bg-white border-[#1a1a1a] hover:bg-yellow-50 hover:border-yellow-400 cursor-grab active:cursor-grabbing';
              return (
                <div key={card} draggable={!assigned && !checked}
                  onDragStart={e => onDragStart(e, card)} onDragEnd={onDragEnd}
                  onClick={() => handleCardClick(card)} className={cls}>
                  <span className={`block text-xs font-black mb-2 tracking-widest ${isSelected || isDraggingThis ? 'text-blue-200' : 'text-gray-400'}`}>
                    {isDraggingThis ? '📦 DRAGGING...' : isSelected ? '✨ SELECTED — tap a zone →' : assigned ? '✓ PLACED' : 'CHOICE'}
                  </span>
                  {actionText(card)}
                </div>
              );
            })}
          </div>

          {/* ── RIGHT: Result zones with images ─────────────────────── */}
          <div className="space-y-3">
            <p className="font-black text-xs tracking-widest text-gray-400 text-center">WHERE IT LEADS</p>
            {(['good-result', 'bad-result'] as const).map(zone => {
              const placed = cardInZone(zone);
              const isGoodZone = zone === 'good-result';
              const expectedCard: CardKey = isGoodZone ? 'good' : 'bad';
              const isHovering = dragOver === zone;
              const isActive = (selected !== null || dragging !== null) && !checked;

              let zoneCls = 'rounded-2xl border-2 p-3 flex flex-col gap-2 transition-all ';
              if (!checked) {
                if (isHovering) zoneCls += isGoodZone ? 'bg-green-100 border-green-500 scale-[1.02] shadow-lg cursor-copy' : 'bg-red-100 border-red-500 scale-[1.02] shadow-lg cursor-copy';
                else if (isActive) zoneCls += isGoodZone ? 'bg-green-50 border-green-400 border-dashed cursor-pointer' : 'bg-red-50 border-red-400 border-dashed cursor-pointer';
                else zoneCls += isGoodZone ? 'bg-green-50 border-green-200 border-dashed' : 'bg-red-50 border-red-200 border-dashed';
              } else {
                zoneCls += placed === expectedCard ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-400';
              }

              return (
                <div key={zone} onClick={() => handleZoneClick(zone)}
                  onDragOver={e => onDragOver(e, zone)} onDragLeave={onDragLeave}
                  onDrop={e => onDrop(e, zone)} className={zoneCls}>

                  <span className={`font-black text-sm tracking-widest ${isGoodZone ? 'text-green-600' : 'text-red-500'}`}>
                    {isGoodZone ? '😊 GREAT OUTCOME' : '😢 HARD OUTCOME'}
                  </span>

                  {/* Result image */}
                  <ResultImage
                    keyword={isGoodZone ? q.goodImageKw : q.badImageKw}
                    id={q.id}
                    seed={isGoodZone ? 0 : 1}
                  />

                  <span className="text-sm font-semibold text-gray-700 leading-snug">
                    {isGoodZone ? q.goodResult : q.badResult}
                  </span>

                  {placed ? (
                    <div className={`mt-1 rounded-xl px-3 py-2 text-sm font-bold border leading-snug ${
                      checked
                        ? placed === expectedCard ? 'bg-green-50 border-green-400 text-green-800' : 'bg-red-50 border-red-400 text-red-800'
                        : 'bg-white border-gray-300 text-gray-700'
                    }`}>
                      {actionText(placed)}
                    </div>
                  ) : (
                    <div className={`rounded-xl border border-dashed px-3 py-2 text-sm font-bold text-center transition-colors ${
                      isHovering
                        ? isGoodZone ? 'border-green-400 text-green-500 bg-green-50' : 'border-red-400 text-red-400 bg-red-50'
                        : 'border-gray-300 text-gray-400'
                    }`}>
                      {isHovering ? '⬇ Release to drop' : 'Drop here'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {checked && correct === false && (
          <div className="mt-4 card-comic-sm bg-blue-50 border-blue-300 rounded-2xl p-4 text-sm font-semibold text-blue-800">
            <p className="font-black mb-2">💡 The correct matching:</p>
            <p>✅ <strong>{q.goodAction}</strong> → {q.goodResult}</p>
            <p className="mt-1">❌ <strong>{q.badAction}</strong> → {q.badResult}</p>
          </div>
        )}

        <div className="mt-5 flex gap-3">
          {!checked ? (
            <button onClick={handleCheck} disabled={!canCheck}
              className={`flex-1 font-black text-lg py-3 rounded-xl transition card-comic ${
                canCheck ? 'bg-[#FFD015] text-[#1a1a1a] hover:bg-yellow-300' : 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
              }`}>
              {canCheck ? 'Check! ✓' : 'Place both choices first...'}
            </button>
          ) : (
            <button onClick={handleNext}
              className="flex-1 font-black text-lg py-3 rounded-xl transition card-comic bg-[#4A6CF7] text-white hover:opacity-90">
              {wsIdx + 1 >= total ? '🏆 See Results!' : 'Next Situation →'}
            </button>
          )}
        </div>
      </div>

      <div className="text-center">
        <button onClick={onBack} className="text-xs font-bold text-gray-400 hover:text-gray-600">
          ← Back to Why You Must Study
        </button>
      </div>
    </div>
  );
}

export default function GrowPage() {
  const [phase, setPhase] = useState<Phase>('splash');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sessionQuestions, setSessionQuestions] = useState<GrowthQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);

  const [order, setOrder] = useState<[CardKey, CardKey]>(['good', 'bad']);
  const [selected, setSelected] = useState<CardKey | null>(null);
  const [assignment, setAssignment] = useState<Assignment>({ good: null, bad: null });
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState<boolean | null>(null);

  const [dragging, setDragging] = useState<CardKey | null>(null);
  const [dragOver, setDragOver] = useState<Zone | null>(null);

  const q: GrowthQuestion | undefined = sessionQuestions[idx];

  const resetQuestion = useCallback(() => {
    setOrder(Math.random() > 0.5 ? ['good', 'bad'] : ['bad', 'good']);
    setSelected(null);
    setAssignment({ good: null, bad: null });
    setChecked(false);
    setCorrect(null);
    setDragging(null);
    setDragOver(null);
  }, []);

  useEffect(() => {
    if (phase === 'playing') resetQuestion();
  }, [idx, phase, resetQuestion]);

  const startLesson = (category: string) => {
    const qs = getSessionQuestions(category);
    setSelectedCategory(category);
    setSessionQuestions(qs);
    setIdx(0);
    setScore(0);
    setPhase('playing');
  };

  const assignCard = (card: CardKey, zone: Zone) => {
    if (checked) return;
    setAssignment(prev => {
      const next = { ...prev };
      if (next.good === zone) next.good = null;
      if (next.bad === zone) next.bad = null;
      next[card] = zone;
      return next;
    });
    setSelected(null);
  };

  const handleCardClick = (card: CardKey) => {
    if (checked || cardIsAssigned(card)) return;
    setSelected(prev => (prev === card ? null : card));
  };

  const handleZoneClick = (zone: Zone) => {
    if (checked || !selected) return;
    assignCard(selected, zone);
  };

  const onDragStart = (e: React.DragEvent, card: CardKey) => {
    e.dataTransfer.setData('card', card);
    e.dataTransfer.effectAllowed = 'move';
    setDragging(card);
    setSelected(null);
  };

  const onDragEnd = () => {
    setDragging(null);
    setDragOver(null);
  };

  const onDragOver = (e: React.DragEvent, zone: Zone) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(zone);
  };

  const onDragLeave = (e: React.DragEvent) => {
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      setDragOver(null);
    }
  };

  const onDrop = (e: React.DragEvent, zone: Zone) => {
    e.preventDefault();
    const card = e.dataTransfer.getData('card') as CardKey;
    if (card === 'good' || card === 'bad') assignCard(card, zone);
    setDragging(null);
    setDragOver(null);
  };

  const canCheck = assignment.good !== null && assignment.bad !== null;

  const handleCheck = () => {
    if (!canCheck) return;
    const isCorrect = assignment.good === 'good-result' && assignment.bad === 'bad-result';
    setCorrect(isCorrect);
    setChecked(true);
    if (isCorrect) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (idx + 1 >= sessionQuestions.length) {
      advancePosition(selectedCategory, sessionQuestions.length);
      setPhase('done');
    } else {
      setIdx(i => i + 1);
    }
  };

  const cardInZone = (zone: Zone): CardKey | null => {
    if (assignment.good === zone) return 'good';
    if (assignment.bad === zone) return 'bad';
    return null;
  };

  const actionText = (card: CardKey) => (card === 'good' ? q!.goodAction : q!.badAction);
  const cardIsAssigned = (card: CardKey) => assignment[card] !== null;

  /* ── SPLASH — "Why You Must Study" ────────────────────────────────────── */
  if (phase === 'splash') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card-comic bg-white rounded-3xl p-8 text-center">
          <div className="text-7xl mb-4">📚</div>
          <h1 className="font-black text-4xl text-[#1a1a1a] mb-2 tracking-wide">WHY YOU MUST STUDY</h1>
          <p className="text-gray-500 font-bold mb-8 text-lg">A lesson about your amazing future</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-left">
            <div className="card-comic-sm bg-blue-50 border-blue-300 rounded-2xl p-4">
              <div className="text-3xl mb-2">💡</div>
              <div className="font-black text-[#1a1a1a] mb-1">Your Choices Matter</div>
              <div className="text-sm font-semibold text-gray-500">Every small decision today shapes the life you will have tomorrow</div>
            </div>
            <div className="card-comic-sm bg-yellow-50 border-yellow-300 rounded-2xl p-4">
              <div className="text-3xl mb-2">🚀</div>
              <div className="font-black text-[#1a1a1a] mb-1">1000 Activities</div>
              <div className="text-sm font-semibold text-gray-500">Money, health, friends, skills, and your future — all in one place</div>
            </div>
            <div className="card-comic-sm bg-green-50 border-green-300 rounded-2xl p-4">
              <div className="text-3xl mb-2">🌱</div>
              <div className="font-black text-[#1a1a1a] mb-1">Grow Every Day</div>
              <div className="text-sm font-semibold text-gray-500">Play 20 activities per session and level up from easy to very hard</div>
            </div>
          </div>

          <div className="card-comic-sm bg-[#FFF9C4] border-yellow-400 rounded-2xl p-6 mb-8 text-left">
            <p className="font-black text-lg text-[#1a1a1a] mb-4">🤔 Why does studying matter?</p>
            <div className="space-y-3 text-sm font-semibold text-gray-700">
              <div className="flex gap-3 items-start">
                <span className="text-xl shrink-0">💰</span>
                <span><strong>Money:</strong> Kids who study earn 3× more as adults and never worry about paying bills</span>
              </div>
              <div className="flex gap-3 items-start">
                <span className="text-xl shrink-0">💪</span>
                <span><strong>Health:</strong> Education helps you understand your body and make choices that keep you strong for life</span>
              </div>
              <div className="flex gap-3 items-start">
                <span className="text-xl shrink-0">🤝</span>
                <span><strong>Friends:</strong> Learning makes you interesting, empathetic, and a better teammate and leader</span>
              </div>
              <div className="flex gap-3 items-start">
                <span className="text-xl shrink-0">🎨</span>
                <span><strong>Skills:</strong> Every great inventor, artist, or athlete practiced and studied more than anyone else</span>
              </div>
              <div className="flex gap-3 items-start">
                <span className="text-xl shrink-0">🚀</span>
                <span><strong>Future:</strong> The choices you make <em>right now</em> are building the person you will become</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => setPhase('why-study')}
              className="card-comic w-full bg-[#4A6CF7] text-white font-black py-5 rounded-2xl text-xl hover:opacity-90 transition"
            >
              📚 Start Lesson — Why You Must Study!
            </button>
            <button
              onClick={() => setPhase('intro')}
              className="card-comic-sm w-full bg-white text-[#1a1a1a] font-black py-3 rounded-2xl text-base hover:bg-gray-50 transition border-2"
            >
              🌱 Explore All 5 Topics (1000 questions)
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── WHY-STUDY player ──────────────────────────────────────────────────── */
  if (phase === 'why-study' || phase === 'why-done') {
    return (
      <WhyStudyLesson
        onBack={() => setPhase('splash')}
        onAllTopics={() => setPhase('intro')}
      />
    );
  }

  /* ── INTRO — category selection ────────────────────────────────────────── */
  if (phase === 'intro') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card-comic bg-white rounded-3xl p-8 text-center">
          <div className="text-7xl mb-4">🌱</div>
          <h1 className="font-black text-4xl text-[#1a1a1a] mb-2 tracking-wide">GROW YOUR FUTURE</h1>
          <p className="text-gray-500 font-bold mb-8 text-lg">Choose a topic and play 20 activities</p>

          <div className="grid grid-cols-1 gap-3 mb-8 text-left">
            {CATEGORIES.map(cat => {
              const meta = CATEGORY_META[cat] ?? { emoji: '📚', color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-300' };
              const { done, total } = getCategoryProgress(cat);
              const sessions = Math.floor(done / SESSION_SIZE);
              const pct = Math.round((done / total) * 100);
              return (
                <button
                  key={cat}
                  onClick={() => startLesson(cat)}
                  className={`w-full text-left ${meta.bg} border-2 ${meta.border} card-comic-sm rounded-2xl p-4 hover:opacity-90 transition`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{meta.emoji}</span>
                      <span className={`font-black text-lg ${meta.color}`}>{cat}</span>
                    </div>
                    {done > 0 && (
                      <span className="text-xs font-black text-gray-500">{sessions} session{sessions !== 1 ? 's' : ''} done · {pct}%</span>
                    )}
                  </div>
                  <div className="h-2 bg-white rounded-full border border-gray-200 overflow-hidden">
                    <div className="h-full bg-[#4A6CF7] rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs font-semibold text-gray-500 mt-2">
                    {done === 0
                      ? `20 activities from ${total} total — starts easy`
                      : done >= total
                      ? `All ${total} done! Restart from beginning`
                      : `Next: questions ${done + 1}–${Math.min(done + SESSION_SIZE, total)} of ${total}`}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="card-comic-sm bg-[#FFF9C4] border-yellow-400 rounded-2xl p-5 text-left">
            <p className="font-black text-sm text-[#1a1a1a] mb-2">How to play:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-gray-700">
              <div className="flex gap-2 items-start"><span>🖱️</span><span><strong>Desktop:</strong> Drag an action card and drop it on the correct outcome zone</span></div>
              <div className="flex gap-2 items-start"><span>👆</span><span><strong>Mobile:</strong> Tap a card to select it, then tap a result zone</span></div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <button onClick={() => setPhase('splash')} className="text-xs font-bold text-gray-400 hover:text-gray-600">
              ← Back to Why You Must Study
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── DONE ──────────────────────────────────────────────────────────────── */
  if (phase === 'done') {
    const pct = Math.round((score / sessionQuestions.length) * 100);
    const { done: newDone, total } = getCategoryProgress(selectedCategory);
    const msg = pct === 100 ? '🏆 PERFECT! Flawless round!'
      : pct >= 80 ? '🌟 Excellent! Keep it up!'
      : pct >= 60 ? '👍 Good job! You\'re getting there.'
      : '💪 Keep going! Every lesson makes you wiser.';
    const meta = CATEGORY_META[selectedCategory] ?? { emoji: '📚', color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-300' };
    return (
      <div className="max-w-xl mx-auto text-center">
        <div className="card-comic bg-white rounded-3xl p-8">
          <div className="text-7xl mb-4">{pct === 100 ? '🏆' : pct >= 80 ? '🌟' : '🌱'}</div>
          <h1 className="font-black text-3xl text-[#1a1a1a] mb-2">SESSION COMPLETE!</h1>
          <p className={`font-bold mb-6 ${meta.color}`}>{meta.emoji} {selectedCategory}</p>

          <div className="card-comic-sm bg-[#4A6CF7] text-white rounded-2xl p-5 mb-6">
            <div className="font-black text-5xl mb-1">{score}/{sessionQuestions.length}</div>
            <div className="font-bold text-blue-200">{pct}% correct</div>
          </div>

          <p className="font-black text-lg text-[#1a1a1a] mb-6">{msg}</p>

          <div className={`card-comic-sm ${meta.bg} border-2 ${meta.border} rounded-2xl p-4 mb-8 text-left`}>
            <p className="font-black text-sm mb-1">📊 Your progress in {selectedCategory}:</p>
            <div className="h-3 bg-white rounded-full border border-gray-200 overflow-hidden mb-1">
              <div className="h-full bg-[#4A6CF7] rounded-full" style={{ width: `${Math.round((newDone / total) * 100)}%` }} />
            </div>
            <p className="text-xs font-semibold text-gray-600">
              {newDone >= total
                ? `All ${total} questions completed! Next session restarts from the beginning.`
                : `${newDone} / ${total} questions done — next session picks up from here`}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={() => startLesson(selectedCategory)}
              className="card-comic-sm bg-[#4A6CF7] text-white font-black py-3 px-6 rounded-xl hover:opacity-90 transition">
              🔄 Play Again
            </button>
            <button onClick={() => setPhase('intro')}
              className={`card-comic-sm ${meta.bg} font-black py-3 px-6 rounded-xl hover:opacity-90 transition border-2 ${meta.border} ${meta.color}`}>
              🗂️ Change Topic
            </button>
            <Link href="/"
              className="card-comic-sm bg-white text-[#1a1a1a] font-black py-3 px-6 rounded-xl hover:bg-gray-50 transition">
              🏠 Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!q) return null;

  /* ── PLAYING ───────────────────────────────────────────────────────────── */
  return (
    <div className="max-w-3xl mx-auto">
      <ProgressBar current={idx} total={sessionQuestions.length} />

      <div className="flex items-center justify-end mb-4">
        <span className="font-black text-sm text-gray-500">⭐ {score} correct</span>
      </div>

      <div className="card-comic bg-white rounded-2xl p-5 mb-4">
        <QuestionImage q={q} />

        <p className="font-black text-sm text-gray-400 text-center mb-1 tracking-widest">ACTIVITY {idx + 1}</p>
        <p className="font-black text-2xl text-center text-[#1a1a1a] mb-2">
          What happens when you make these choices?
        </p>
        <p className="text-sm font-semibold text-center text-gray-400 mb-5 min-h-[20px]">
          {!checked && !dragging && !selected && '🖱️ Drag a card to a zone — or tap to select then tap a zone'}
          {!checked && dragging && '📦 Drop it on the correct outcome →'}
          {!checked && selected && !dragging && '👆 Now tap a result zone on the right →'}
          {checked && correct && '🎉 Perfect match!'}
          {checked && correct === false && '❌ Not quite — see the correct answer below'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* ── LEFT: ACTION CARDS ────────────────────────────────────────── */}
          <div className="space-y-3">
            <p className="font-black text-xs tracking-widest text-gray-400 text-center">YOUR CHOICES</p>
            {order.map(card => {
              const assigned = cardIsAssigned(card);
              const isSelected = selected === card;
              const isDraggingThis = dragging === card;

              let cls = 'w-full rounded-2xl border-2 p-5 text-left font-bold text-base leading-snug transition select-none ';
              if (checked) {
                cls += 'bg-gray-100 border-gray-200 opacity-50 cursor-default';
              } else if (assigned) {
                cls += 'bg-gray-50 border-gray-200 opacity-40 cursor-default';
              } else if (isDraggingThis) {
                cls += 'bg-[#4A6CF7] text-white border-[#4A6CF7] opacity-50 cursor-grabbing scale-95';
              } else if (isSelected) {
                cls += 'bg-[#4A6CF7] text-white border-[#4A6CF7] shadow-[0_0_0_4px_rgba(74,108,247,0.35)] cursor-pointer';
              } else {
                cls += 'bg-white border-[#1a1a1a] hover:bg-yellow-50 hover:border-yellow-400 cursor-grab active:cursor-grabbing';
              }

              return (
                <div
                  key={card}
                  draggable={!assigned && !checked}
                  onDragStart={e => onDragStart(e, card)}
                  onDragEnd={onDragEnd}
                  onClick={() => handleCardClick(card)}
                  className={cls}
                >
                  <span className={`block text-xs font-black mb-2 tracking-widest ${isSelected || isDraggingThis ? 'text-blue-200' : 'text-gray-400'}`}>
                    {isDraggingThis ? '📦 DRAGGING...' : isSelected ? '✨ SELECTED — tap a zone →' : assigned ? '✓ PLACED' : 'CHOICE'}
                  </span>
                  {actionText(card)}
                </div>
              );
            })}
          </div>

          {/* ── RIGHT: RESULT ZONES ───────────────────────────────────────── */}
          <div className="space-y-3">
            <p className="font-black text-xs tracking-widest text-gray-400 text-center">WHERE IT LEADS</p>

            {(['good-result', 'bad-result'] as const).map(zone => {
              const placed = cardInZone(zone);
              const isGoodZone = zone === 'good-result';
              const expectedCard: CardKey = isGoodZone ? 'good' : 'bad';
              const isHovering = dragOver === zone;
              const isActive = (selected !== null || dragging !== null) && !checked;

              let zoneCls = 'rounded-2xl border-2 p-4 min-h-[110px] flex flex-col gap-2 transition-all ';
              if (!checked) {
                if (isHovering) {
                  zoneCls += isGoodZone
                    ? 'bg-green-100 border-green-500 border-solid scale-[1.02] shadow-lg cursor-copy'
                    : 'bg-red-100 border-red-500 border-solid scale-[1.02] shadow-lg cursor-copy';
                } else if (isActive) {
                  zoneCls += isGoodZone
                    ? 'bg-green-50 border-green-400 border-dashed cursor-pointer'
                    : 'bg-red-50 border-red-400 border-dashed cursor-pointer';
                } else {
                  zoneCls += isGoodZone
                    ? 'bg-green-50 border-green-200 border-dashed'
                    : 'bg-red-50 border-red-200 border-dashed';
                }
              } else {
                const ok = placed === expectedCard;
                zoneCls += ok ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-400';
              }

              return (
                <div
                  key={zone}
                  onClick={() => handleZoneClick(zone)}
                  onDragOver={e => onDragOver(e, zone)}
                  onDragLeave={onDragLeave}
                  onDrop={e => onDrop(e, zone)}
                  className={zoneCls}
                >
                  <span className={`font-black text-sm tracking-widest ${isGoodZone ? 'text-green-600' : 'text-red-500'}`}>
                    {isGoodZone ? '😊 GREAT OUTCOME' : '😢 HARD OUTCOME'}
                  </span>
                  <span className="text-sm font-semibold text-gray-700 leading-snug">
                    {isGoodZone ? q.goodResult : q.badResult}
                  </span>

                  {placed ? (
                    <div className={`mt-2 rounded-xl px-3 py-2 text-sm font-bold border leading-snug ${
                      checked
                        ? placed === expectedCard
                          ? 'bg-green-50 border-green-400 text-green-800'
                          : 'bg-red-50 border-red-400 text-red-800'
                        : 'bg-white border-gray-300 text-gray-700'
                    }`}>
                      {actionText(placed)}
                    </div>
                  ) : (
                    <div className={`mt-auto rounded-xl border border-dashed px-3 py-2 text-sm font-bold text-center transition-colors ${
                      isHovering
                        ? isGoodZone ? 'border-green-400 text-green-500 bg-green-50' : 'border-red-400 text-red-400 bg-red-50'
                        : 'border-gray-300 text-gray-400'
                    }`}>
                      {isHovering ? '⬇ Release to drop' : 'Drop here'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {checked && correct === false && (
          <div className="mt-4 card-comic-sm bg-blue-50 border-blue-300 rounded-2xl p-4 text-sm font-semibold text-blue-800">
            <p className="font-black mb-2">💡 The correct matching:</p>
            <p>✅ <strong>{q.goodAction}</strong> → {q.goodResult}</p>
            <p className="mt-1">❌ <strong>{q.badAction}</strong> → {q.badResult}</p>
          </div>
        )}

        <div className="mt-5 flex gap-3">
          {!checked ? (
            <button onClick={handleCheck} disabled={!canCheck}
              className={`flex-1 font-black text-lg py-3 rounded-xl transition card-comic ${
                canCheck
                  ? 'bg-[#FFD015] text-[#1a1a1a] hover:bg-yellow-300'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
              }`}>
              {canCheck ? 'Check! ✓' : 'Place both actions first...'}
            </button>
          ) : (
            <button onClick={handleNext}
              className="flex-1 font-black text-lg py-3 rounded-xl transition card-comic bg-[#4A6CF7] text-white hover:opacity-90">
              {idx + 1 >= sessionQuestions.length ? '🏆 See Results!' : 'Next Activity →'}
            </button>
          )}
        </div>
      </div>

      <div className="text-center">
        <button onClick={() => setPhase('intro')} className="text-xs font-bold text-gray-400 hover:text-gray-600">← Change Topic</button>
      </div>
    </div>
  );
}
