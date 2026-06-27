'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { generateQuestion, TOPICS, type Topic, type Question } from '@/lib/questions';

interface Student { id: number; name: string; }

type Phase = 'setup' | 'playing' | 'result';

function PracticeApp() {
  const searchParams = useSearchParams();
  const topicParam = searchParams.get('topic') as Topic | null;

  const [phase, setPhase] = useState<Phase>('setup');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [newName, setNewName] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<Topic>(topicParam ?? 'addition');

  const [question, setQuestion] = useState<Question | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [qCount, setQCount] = useState(0);
  const TOTAL_Q = 10;

  useEffect(() => {
    fetch('/api/students').then(r => r.json()).then(setStudents);
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
    setSelectedStudent(s.id);
    setNewName('');
  };

  const nextQuestion = useCallback(() => {
    setQuestion(generateQuestion(selectedTopic));
    setChosen(null);
    setIsCorrect(null);
  }, [selectedTopic]);

  const startGame = () => {
    setScore({ correct: 0, wrong: 0 });
    setQCount(0);
    setPhase('playing');
    nextQuestion();
  };

  const handleAnswer = async (choice: string) => {
    if (chosen || !question) return;
    setChosen(choice);
    const correct = choice === question.answer;
    setIsCorrect(correct);

    if (selectedStudent) {
      await fetch('/api/answers', {
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

    const newScore = { ...score, [correct ? 'correct' : 'wrong']: score[correct ? 'correct' : 'wrong'] + 1 };
    setScore(newScore);
    const newCount = qCount + 1;
    setQCount(newCount);

    setTimeout(() => {
      if (newCount >= TOTAL_Q) {
        setPhase('result');
      } else {
        nextQuestion();
      }
    }, 1200);
  };

  const topicInfo = TOPICS.find(t => t.id === selectedTopic)!;

  if (phase === 'setup') {
    return (
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold text-blue-700 mb-6 text-center">🎯 Set Up Your Practice</h1>

        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <h2 className="font-bold text-lg mb-3">Who is practicing?</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {students.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedStudent(s.id)}
                className={`px-4 py-2 rounded-full border-2 font-semibold transition ${
                  selectedStudent === s.id
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'border-gray-300 text-gray-700 hover:border-blue-400'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="border-2 border-gray-300 rounded-xl px-3 py-2 flex-1 focus:outline-none focus:border-blue-400"
              placeholder="Add new student..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addStudent()}
            />
            <button
              onClick={addStudent}
              className="bg-blue-500 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-600"
            >
              Add
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <h2 className="font-bold text-lg mb-3">Choose a topic</h2>
          <div className="grid grid-cols-2 gap-3">
            {TOPICS.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTopic(t.id)}
                className={`border-2 rounded-xl p-3 font-semibold text-left transition ${
                  selectedTopic === t.id ? t.color + ' border-current' : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={startGame}
          disabled={!selectedStudent}
          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-bold py-4 rounded-2xl text-xl transition"
        >
          {selectedStudent ? '🚀 Start!' : 'Select a student first'}
        </button>
      </div>
    );
  }

  if (phase === 'result') {
    const pct = Math.round((score.correct / TOTAL_Q) * 100);
    const star = pct >= 90 ? '🌟' : pct >= 70 ? '😊' : pct >= 50 ? '💪' : '📚';
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="bg-white rounded-3xl shadow-lg p-10">
          <div className="text-7xl mb-4">{star}</div>
          <h1 className="text-3xl font-bold mb-2">
            {pct >= 90 ? 'Amazing!' : pct >= 70 ? 'Great Job!' : pct >= 50 ? 'Keep Going!' : 'Practice More!'}
          </h1>
          <p className="text-gray-500 mb-6">{topicInfo.emoji} {topicInfo.label}</p>
          <div className="flex justify-center gap-8 mb-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600">{score.correct}</div>
              <div className="text-sm text-gray-500">Correct ✅</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-red-500">{score.wrong}</div>
              <div className="text-sm text-gray-500">Wrong ❌</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">{pct}%</div>
              <div className="text-sm text-gray-500">Score</div>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={startGame}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full transition"
            >
              Try Again 🔄
            </button>
            <a
              href="/practice"
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded-full transition"
            >
              Change Topic
            </a>
            <a
              href="/report"
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full transition"
            >
              Reports 📊
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <span className={`px-3 py-1 rounded-full font-bold text-sm ${topicInfo.color}`}>
          {topicInfo.emoji} {topicInfo.label}
        </span>
        <span className="text-gray-500 font-semibold">
          {qCount}/{TOTAL_Q} &nbsp;|&nbsp; ✅ {score.correct} &nbsp; ❌ {score.wrong}
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
        <div
          className="bg-blue-500 h-3 rounded-full transition-all"
          style={{ width: `${(qCount / TOTAL_Q) * 100}%` }}
        />
      </div>

      {question && (
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <p className="text-2xl font-bold text-center mb-8 leading-relaxed">{question.question}</p>

          <div className="grid grid-cols-2 gap-4">
            {question.choices.map(c => {
              let style = 'border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50';
              if (chosen) {
                if (c === question.answer) style = 'border-2 border-green-500 bg-green-100';
                else if (c === chosen) style = 'border-2 border-red-400 bg-red-100';
                else style = 'border-2 border-gray-200 opacity-50';
              }
              return (
                <button
                  key={c}
                  onClick={() => handleAnswer(c)}
                  disabled={!!chosen}
                  className={`${style} rounded-2xl py-5 text-xl font-bold transition text-center`}
                >
                  {c}
                </button>
              );
            })}
          </div>

          {chosen && (
            <div className={`mt-6 text-center text-2xl font-bold ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
              {isCorrect ? '✅ Correct! Great job!' : `❌ The answer is ${question.answer}`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-2xl">Loading... ⏳</div>}>
      <PracticeApp />
    </Suspense>
  );
}
