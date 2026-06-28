'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { GROWTH_QUESTIONS, type GrowthQuestion } from '@/lib/growth-questions';

type Slot = 'good-result' | 'bad-result' | null;
type Assignment = { good: Slot; bad: Slot };
type CardKey = 'good' | 'bad';
type Zone = 'good-result' | 'bad-result';
type Phase = 'intro' | 'playing' | 'done';

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

export default function GrowPage() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);

  const [order, setOrder] = useState<[CardKey, CardKey]>(['good', 'bad']);
  const [selected, setSelected] = useState<CardKey | null>(null);
  const [assignment, setAssignment] = useState<Assignment>({ good: null, bad: null });
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState<boolean | null>(null);

  // Drag state
  const [dragging, setDragging] = useState<CardKey | null>(null);
  const [dragOver, setDragOver] = useState<Zone | null>(null);

  const q: GrowthQuestion = GROWTH_QUESTIONS[idx];

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

  const startLesson = () => {
    setIdx(0);
    setScore(0);
    setPhase('playing');
  };

  // Core assignment logic — shared between click and drag
  const assignCard = (card: CardKey, zone: Zone) => {
    if (checked) return;
    setAssignment(prev => {
      const next = { ...prev };
      // Vacate the target zone if another card is already there
      if (next.good === zone) next.good = null;
      if (next.bad === zone) next.bad = null;
      next[card] = zone;
      return next;
    });
    setSelected(null);
  };

  // ── Click interaction ────────────────────────────────────────────────────
  const handleCardClick = (card: CardKey) => {
    if (checked || cardIsAssigned(card)) return;
    setSelected(prev => (prev === card ? null : card));
  };

  const handleZoneClick = (zone: Zone) => {
    if (checked || !selected) return;
    assignCard(selected, zone);
  };

  // ── Drag interaction ─────────────────────────────────────────────────────
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
    // Only clear if leaving the zone itself (not a child element)
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

  // ── Helpers ───────────────────────────────────────────────────────────────
  const canCheck = assignment.good !== null && assignment.bad !== null;

  const handleCheck = () => {
    if (!canCheck) return;
    const isCorrect = assignment.good === 'good-result' && assignment.bad === 'bad-result';
    setCorrect(isCorrect);
    setChecked(true);
    if (isCorrect) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (idx + 1 >= GROWTH_QUESTIONS.length) setPhase('done');
    else setIdx(i => i + 1);
  };

  const cardInZone = (zone: Zone): CardKey | null => {
    if (assignment.good === zone) return 'good';
    if (assignment.bad === zone) return 'bad';
    return null;
  };

  const actionText = (card: CardKey) => (card === 'good' ? q.goodAction : q.badAction);
  const cardIsAssigned = (card: CardKey) => assignment[card] !== null;

  /* ── INTRO ─────────────────────────────────────────────────────────────── */
  if (phase === 'intro') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card-comic bg-white rounded-3xl p-8 text-center">
          <div className="text-7xl mb-4">🌱</div>
          <h1 className="font-black text-4xl text-[#1a1a1a] mb-2 tracking-wide">WHY YOU MUST STUDY</h1>
          <p className="text-gray-500 font-bold mb-8 text-lg">A lesson about your amazing future</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-left">
            <div className="card-comic-sm bg-blue-50 border-blue-300 rounded-2xl p-4">
              <div className="text-3xl mb-2">🎮</div>
              <div className="font-black text-[#1a1a1a] mb-1">Interactive</div>
              <div className="text-sm font-semibold text-gray-500">Match choices to their real outcomes in life</div>
            </div>
            <div className="card-comic-sm bg-yellow-50 border-yellow-300 rounded-2xl p-4">
              <div className="text-3xl mb-2">🤔</div>
              <div className="font-black text-[#1a1a1a] mb-1">50 Activities</div>
              <div className="text-sm font-semibold text-gray-500">Money, health, friends, skills, and your future</div>
            </div>
            <div className="card-comic-sm bg-green-50 border-green-300 rounded-2xl p-4">
              <div className="text-3xl mb-2">💡</div>
              <div className="font-black text-[#1a1a1a] mb-1">Discover</div>
              <div className="text-sm font-semibold text-gray-500">How today's choices change your entire life</div>
            </div>
          </div>

          <div className="card-comic-sm bg-[#FFF9C4] border-yellow-400 rounded-2xl p-5 mb-8 text-left">
            <p className="font-black text-lg text-[#1a1a1a] mb-3">How to play:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-semibold text-gray-700">
              <div className="flex gap-2 items-start">
                <span className="text-xl">🖱️</span>
                <span><strong>Desktop:</strong> Drag an action card and drop it on the correct outcome zone</span>
              </div>
              <div className="flex gap-2 items-start">
                <span className="text-xl">👆</span>
                <span><strong>Mobile:</strong> Tap an action card to select it, then tap the result zone</span>
              </div>
            </div>
          </div>

          <button onClick={startLesson}
            className="card-comic w-full bg-[#4A6CF7] text-white font-black py-5 rounded-2xl text-xl hover:opacity-90 transition">
            🚀 Start the Lesson!
          </button>
        </div>
      </div>
    );
  }

  /* ── DONE ──────────────────────────────────────────────────────────────── */
  if (phase === 'done') {
    const pct = Math.round((score / GROWTH_QUESTIONS.length) * 100);
    const msg = pct === 100 ? '🏆 PERFECT! You understand exactly why learning matters!'
      : pct >= 80 ? '🌟 Excellent! You have a great understanding of your future!'
      : pct >= 60 ? '👍 Good job! Keep thinking about your choices every day.'
      : '💪 Keep going! Every lesson makes you wiser about your future.';
    return (
      <div className="max-w-xl mx-auto text-center">
        <div className="card-comic bg-white rounded-3xl p-8">
          <div className="text-7xl mb-4">{pct === 100 ? '🏆' : pct >= 80 ? '🌟' : '🌱'}</div>
          <h1 className="font-black text-3xl text-[#1a1a1a] mb-2">LESSON COMPLETE!</h1>
          <p className="font-bold text-gray-500 mb-6">Why You Must Study</p>

          <div className="card-comic-sm bg-[#4A6CF7] text-white rounded-2xl p-5 mb-6">
            <div className="font-black text-5xl mb-1">{score}/{GROWTH_QUESTIONS.length}</div>
            <div className="font-bold text-blue-200">{pct}% correct</div>
          </div>

          <p className="font-black text-lg text-[#1a1a1a] mb-8">{msg}</p>

          <div className="card-comic-sm bg-green-50 border-green-300 rounded-2xl p-5 mb-8 text-left">
            <p className="font-black text-green-700 mb-2">🌱 Remember this always:</p>
            <p className="text-sm font-semibold text-gray-700">
              Every hour you spend studying today is an investment in the life you want tomorrow.
              The choices you make at your age shape who you will become.{' '}
              <strong>You have the power to build your amazing future — starting right now.</strong>
            </p>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={startLesson}
              className="card-comic-sm bg-[#4A6CF7] text-white font-black py-3 px-6 rounded-xl hover:opacity-90 transition">
              🔄 Do It Again
            </button>
            <Link href="/practice"
              className="card-comic-sm bg-[#FFD015] text-[#1a1a1a] font-black py-3 px-6 rounded-xl hover:bg-yellow-300 transition">
              🎯 Go Practice Math
            </Link>
            <Link href="/"
              className="card-comic-sm bg-white text-[#1a1a1a] font-black py-3 px-6 rounded-xl hover:bg-gray-50 transition">
              🏠 Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── PLAYING ───────────────────────────────────────────────────────────── */
  return (
    <div className="max-w-3xl mx-auto">
      <ProgressBar current={idx} total={GROWTH_QUESTIONS.length} />

      <div className="flex items-center justify-between mb-4">
        <span className="card-comic-sm px-3 py-1 rounded-full font-black text-sm bg-white border-2">
          {q.emoji} {q.category}
        </span>
        <span className="font-black text-sm text-gray-500">⭐ {score} correct</span>
      </div>

      <div className="card-comic bg-white rounded-2xl p-5 mb-4">
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

        {/* ── After check: explain if wrong ─────────────────────────────── */}
        {checked && correct === false && (
          <div className="mt-4 card-comic-sm bg-blue-50 border-blue-300 rounded-2xl p-4 text-sm font-semibold text-blue-800">
            <p className="font-black mb-2">💡 The correct matching:</p>
            <p>✅ <strong>{q.goodAction}</strong> → {q.goodResult}</p>
            <p className="mt-1">❌ <strong>{q.badAction}</strong> → {q.badResult}</p>
          </div>
        )}

        {/* ── Buttons ───────────────────────────────────────────────────── */}
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
              {idx + 1 >= GROWTH_QUESTIONS.length ? '🏆 See Results!' : 'Next Activity →'}
            </button>
          )}
        </div>
      </div>

      <div className="text-center">
        <Link href="/" className="text-xs font-bold text-gray-400 hover:text-gray-600">← Back to Home</Link>
      </div>
    </div>
  );
}
