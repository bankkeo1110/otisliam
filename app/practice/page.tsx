'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { generateQuestion, TOPICS, TOPIC_CATEGORIES, type Topic, type Question, type Category } from '@/lib/questions';

const CATEGORY_ORDER: Category[] = ['numbers', 'fractions', 'measurement-geometry', 'problem-solving'];

interface Student { id: number; name: string; }
interface BadgeResult { badge: string; isNew: boolean; isUpgrade: boolean; previousBadge: string | null; }

const BADGE_EMOJI: Record<string, string> = { bronze: '🥉', silver: '🥈', gold: '🥇', perfect: '👑' };
const BADGE_LABEL: Record<string, string> = {
  bronze: 'Bronze Badge', silver: 'Silver Badge', gold: 'Gold Badge', perfect: 'Perfect Crown!',
};

const TARGET_POINTS = 100;
const POINTS_CORRECT = 2;
const POINTS_WRONG = 2;

type Phase = 'setup' | 'playing' | 'result';

function PracticeApp() {
  const searchParams = useSearchParams();
  const topicParam = searchParams.get('topic') as Topic | null;

  const [phase, setPhase] = useState<Phase>('setup');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState<string>('');
  const [newName, setNewName] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<Topic>(topicParam ?? 'addition');

  const [question, setQuestion] = useState<Question | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const [points, setPoints] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [earnedBadge, setEarnedBadge] = useState<BadgeResult | null>(null);

  // floating +2 / -2 flash
  const [flash, setFlash] = useState<{ val: string; key: number } | null>(null);
  const flashKey = useRef(0);

  useEffect(() => {
    fetch('/api/students').then(r => r.json()).then(setStudents);
    // restore student from localStorage
    const id = localStorage.getItem('mathapp_student_id');
    const name = localStorage.getItem('mathapp_student_name');
    if (id && name) {
      setSelectedStudent(parseInt(id));
      setSelectedStudentName(name);
    }
  }, []);

  const addStudent = async () => {
    if (!newName.trim()) return;
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    });
    const s = await res.json();
    setStudents(prev => [...prev, s]);
    selectStudent(s.id, s.name);
    setNewName('');
  };

  const selectStudent = (id: number, name: string) => {
    setSelectedStudent(id);
    setSelectedStudentName(name);
    localStorage.setItem('mathapp_student_id', id.toString());
    localStorage.setItem('mathapp_student_name', name);
    window.dispatchEvent(new Event('mathapp_student_changed'));
  };

  const nextQuestion = useCallback(() => {
    setQuestion(generateQuestion(selectedTopic));
    setChosen(null);
    setIsCorrect(null);
  }, [selectedTopic]);

  const startGame = () => {
    setPoints(0);
    setCorrectCount(0);
    setTotalAnswered(0);
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

    // floating flash
    flashKey.current++;
    setFlash({ val: correct ? `+${POINTS_CORRECT}` : `-${POINTS_WRONG}`, key: flashKey.current });
    setTimeout(() => setFlash(null), 700);

    if (selectedStudent) {
      fetch('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent,
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
        // award badge
        if (selectedStudent) {
          try {
            const res = await fetch('/api/sessions/complete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                studentId: selectedStudent,
                topic: selectedTopic,
                correct: newCorrect,
                total: newTotal,
              }),
            });
            setEarnedBadge(await res.json());
          } catch { /* badge award silent fail */ }
        }
        setPhase('result');
      } else {
        nextQuestion();
      }
    }, 1200);
  };

  const topicInfo = TOPICS.find(t => t.id === selectedTopic)!;

  /* ── SETUP PHASE ── */
  if (phase === 'setup') {
    return (
      <div className="max-w-xl mx-auto">
        <h1 className="font-black text-3xl text-[#1a1a1a] mb-6 tracking-wide">🎯 SET UP PRACTICE</h1>

        {/* Student selector */}
        <div className="card-comic bg-white rounded-2xl p-5 mb-5">
          <h2 className="font-black text-sm tracking-[0.15em] mb-3">WHO IS PRACTICING?</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {students.map(s => (
              <button key={s.id}
                onClick={() => selectStudent(s.id, s.name)}
                className={`px-4 py-2 rounded-xl font-black text-sm transition card-comic-sm ${
                  selectedStudent === s.id
                    ? 'bg-[#FFD015] text-[#1a1a1a] border-[#1a1a1a]'
                    : 'bg-white text-[#1a1a1a] hover:bg-yellow-50'
                }`}>
                {s.name}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="card-comic-sm border-[#1a1a1a] rounded-xl px-3 py-2 flex-1 font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Add new name..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addStudent()}
            />
            <button onClick={addStudent}
              className="card-comic-sm bg-[#FFD015] text-[#1a1a1a] font-black px-4 py-2 rounded-xl hover:bg-yellow-300 transition">
              + Add
            </button>
          </div>
        </div>

        {/* Topic selector — grouped by category */}
        <div className="card-comic bg-white rounded-2xl p-5 mb-5">
          <h2 className="font-black text-sm tracking-[0.15em] mb-4">CHOOSE A TOPIC</h2>
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

        {/* Points info */}
        <div className="card-comic-sm bg-blue-50 border-blue-300 rounded-2xl p-4 mb-5 text-sm font-semibold text-blue-700">
          🎮 Score <strong>100 points</strong> to complete a topic &nbsp;·&nbsp;
          ✅ Correct = <strong>+{POINTS_CORRECT} pts</strong> &nbsp;·&nbsp;
          ❌ Wrong = <strong>−{POINTS_WRONG} pts</strong>
        </div>

        <button onClick={startGame} disabled={!selectedStudent}
          className={`w-full font-black py-4 rounded-2xl text-lg transition card-comic ${
            selectedStudent
              ? 'bg-[#FFD015] text-[#1a1a1a] hover:bg-yellow-300'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none border-gray-300'
          }`}>
          {selectedStudent ? '▶ START PRACTICE' : 'Select your name first'}
        </button>
      </div>
    );
  }

  /* ── RESULT PHASE ── */
  if (phase === 'result') {
    const accuracy = totalAnswered ? Math.round((correctCount / totalAnswered) * 100) : 0;
    return (
      <div className="max-w-md mx-auto text-center">

        {/* Badge celebration */}
        {earnedBadge && (earnedBadge.isNew || earnedBadge.isUpgrade) && (
          <div className={`card-comic rounded-2xl mb-4 p-5 animate-pop ${
            earnedBadge.badge === 'perfect' ? 'bg-purple-100 border-purple-500' :
            earnedBadge.badge === 'gold' ? 'bg-yellow-100 border-yellow-500' :
            earnedBadge.badge === 'silver' ? 'bg-gray-100 border-gray-400' :
            'bg-amber-100 border-amber-500'
          }`}>
            <div className="text-6xl mb-1">{BADGE_EMOJI[earnedBadge.badge]}</div>
            <div className="font-black text-xl">
              {earnedBadge.isNew ? '🎉 NEW BADGE EARNED!' : '⬆️ BADGE UPGRADED!'}
            </div>
            <div className="font-semibold text-gray-600 mt-1">
              {earnedBadge.isUpgrade && earnedBadge.previousBadge
                ? `${BADGE_EMOJI[earnedBadge.previousBadge]} → ${BADGE_EMOJI[earnedBadge.badge]} `
                : ''}
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
            <button onClick={startGame}
              className="card-comic-sm bg-[#FFD015] text-[#1a1a1a] font-black py-3 px-5 rounded-xl hover:bg-yellow-300 transition">
              🔄 Try Again
            </button>
            <Link href="/practice"
              className="card-comic-sm bg-white text-[#1a1a1a] font-black py-3 px-5 rounded-xl hover:bg-gray-50 transition">
              Change Topic
            </Link>
            {selectedStudent && (
              <Link href={`/student/${selectedStudent}`}
                className="card-comic-sm bg-[#4A6CF7] text-white font-black py-3 px-5 rounded-xl hover:opacity-90 transition">
                My Profile 🏅
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── PLAYING PHASE ── */
  const progressPct = Math.min(100, (points / TARGET_POINTS) * 100);

  return (
    <div className="max-w-xl mx-auto relative">

      {/* floating +2 / -2 */}
      {flash && (
        <div key={flash.key}
          className={`absolute top-0 right-0 font-black text-3xl pointer-events-none animate-flash z-10 ${
            flash.val.startsWith('+') ? 'text-green-500' : 'text-red-500'
          }`}>
          {flash.val}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setPhase('setup')}
          className="card-comic-sm bg-white font-black text-sm px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
          ← Back
        </button>
        <span className={`card-comic-sm px-3 py-1 rounded-full font-black text-sm ${topicInfo.color}`}>
          {topicInfo.emoji} {topicInfo.label}
        </span>
        <span className="font-black text-sm text-gray-500">
          ✅ {correctCount} ❌ {totalAnswered - correctCount}
        </span>
      </div>

      {/* Points progress */}
      <div className="card-comic bg-white rounded-2xl p-4 mb-5">
        <div className="flex justify-between items-baseline mb-2">
          <span className="font-black text-4xl text-[#1a1a1a]">{points}</span>
          <span className="font-bold text-gray-400">/ {TARGET_POINTS} pts</span>
        </div>
        <div className="h-4 bg-gray-100 rounded-full border-2 border-[#1a1a1a] overflow-hidden">
          <div
            className="h-full bg-[#FFD015] rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="mt-1 text-right text-xs font-bold text-gray-400">{Math.round(progressPct)}% to goal</div>
      </div>

      {/* Question card */}
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
            <div className={`mt-5 text-center font-black text-lg ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
              {isCorrect ? '✅ Correct! Great job!' : `❌ Answer: ${question.answer}`}
            </div>
          )}
        </div>
      )}

      {/* Motivational nudge */}
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
