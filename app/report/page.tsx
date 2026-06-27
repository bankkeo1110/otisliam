'use client';

import { useState, useEffect } from 'react';
import { TOPICS } from '@/lib/questions';

interface Stat {
  studentId: number;
  studentName: string;
  topic: string;
  correct: number;
  wrong: number;
  total: number;
}

interface Student { id: number; name: string; }

interface RecentAnswer {
  id: number;
  studentId: number;
  topic: string;
  question: string;
  correctAnswer: string;
  studentAnswer: string;
  isCorrect: boolean;
  answeredAt: string;
}

export default function ReportPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [recent, setRecent] = useState<RecentAnswer[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const fetchReport = async (studentId: string) => {
    setLoading(true);
    const url = studentId === 'all' ? '/api/report' : `/api/report?studentId=${studentId}`;
    const res = await fetch(url);
    const data = await res.json();
    setStudents(data.students);
    setStats(data.stats);
    setRecent(data.recentAnswers);
    setLoading(false);
  };

  useEffect(() => { fetchReport('all'); }, []);

  const handleFilter = (val: string) => {
    setFilter(val);
    fetchReport(val);
  };

  const exportCSV = () => {
    const url = filter === 'all' ? '/api/export' : `/api/export?studentId=${filter}`;
    window.open(url, '_blank');
  };

  const topicLabel = (id: string) => TOPICS.find(t => t.id === id)?.label ?? id;
  const topicEmoji = (id: string) => TOPICS.find(t => t.id === id)?.emoji ?? '📚';

  // Group stats by student
  const byStudent: Record<string, Stat[]> = {};
  for (const s of stats) {
    if (!byStudent[s.studentName]) byStudent[s.studentName] = [];
    byStudent[s.studentName].push(s);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-blue-700">📊 Reports</h1>
        <button
          onClick={exportCSV}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-5 rounded-full transition"
        >
          ⬇️ Export CSV
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        <button
          onClick={() => handleFilter('all')}
          className={`px-4 py-2 rounded-full font-semibold border-2 transition ${filter === 'all' ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 hover:border-blue-400'}`}
        >
          All Students
        </button>
        {students.map(s => (
          <button
            key={s.id}
            onClick={() => handleFilter(String(s.id))}
            className={`px-4 py-2 rounded-full font-semibold border-2 transition ${filter === String(s.id) ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 hover:border-blue-400'}`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-2xl">Loading... ⏳</div>
      ) : stats.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-xl">No data yet. Start practicing! 🚀</div>
      ) : (
        <>
          {/* Per-student topic breakdown */}
          {Object.entries(byStudent).map(([name, rows]) => {
            const totalCorrect = rows.reduce((a, r) => a + r.correct, 0);
            const totalAll = rows.reduce((a, r) => a + r.total, 0);
            const pct = totalAll > 0 ? Math.round((totalCorrect / totalAll) * 100) : 0;
            return (
              <div key={name} className="bg-white rounded-2xl shadow p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-800">🧒 {name}</h2>
                  <span className={`px-3 py-1 rounded-full font-bold ${pct >= 80 ? 'bg-green-100 text-green-700' : pct >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                    Overall: {pct}%
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {rows.map(r => {
                    const p = Math.round((r.correct / r.total) * 100);
                    const color = p >= 80 ? 'border-green-400 bg-green-50' : p >= 50 ? 'border-yellow-400 bg-yellow-50' : 'border-red-400 bg-red-50';
                    return (
                      <div key={r.topic} className={`border-2 rounded-xl p-3 ${color}`}>
                        <div className="font-bold text-sm mb-1">{topicEmoji(r.topic)} {topicLabel(r.topic)}</div>
                        <div className="flex justify-between text-sm">
                          <span className="text-green-600 font-semibold">✅ {r.correct}</span>
                          <span className="text-red-500 font-semibold">❌ {r.wrong}</span>
                          <span className="text-blue-600 font-bold">{p}%</span>
                        </div>
                        {/* Mini bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div className={`h-2 rounded-full ${p >= 80 ? 'bg-green-500' : p >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${p}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Strength / Weakness summary */}
                {(() => {
                  const sorted = [...rows].sort((a, b) => (b.correct / b.total) - (a.correct / a.total));
                  const best = sorted[0];
                  const worst = sorted[sorted.length - 1];
                  return (
                    <div className="mt-4 flex gap-4 text-sm">
                      <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex-1">
                        <span className="font-bold text-green-700">💪 Strength: </span>
                        <span>{topicEmoji(best.topic)} {topicLabel(best.topic)} ({Math.round((best.correct/best.total)*100)}%)</span>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex-1">
                        <span className="font-bold text-red-600">📚 Needs work: </span>
                        <span>{topicEmoji(worst.topic)} {topicLabel(worst.topic)} ({Math.round((worst.correct/worst.total)*100)}%)</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })}

          {/* Recent answers table */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-xl font-bold mb-4">🕐 Recent Answers</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 text-left text-gray-500">
                    <th className="pb-2 pr-3">Student</th>
                    <th className="pb-2 pr-3">Topic</th>
                    <th className="pb-2 pr-3">Question</th>
                    <th className="pb-2 pr-3">Answer</th>
                    <th className="pb-2 pr-3">Result</th>
                    <th className="pb-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map(r => {
                    const student = students.find(s => s.id === r.studentId);
                    return (
                      <tr key={r.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 pr-3 font-semibold">{student?.name ?? '-'}</td>
                        <td className="py-2 pr-3">{topicEmoji(r.topic)} {topicLabel(r.topic)}</td>
                        <td className="py-2 pr-3 text-gray-600 max-w-xs truncate">{r.question}</td>
                        <td className="py-2 pr-3">
                          {r.isCorrect ? (
                            <span className="text-green-600 font-bold">{r.studentAnswer}</span>
                          ) : (
                            <span>
                              <span className="text-red-500 line-through mr-1">{r.studentAnswer}</span>
                              <span className="text-green-600">→ {r.correctAnswer}</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2 pr-3">{r.isCorrect ? '✅' : '❌'}</td>
                        <td className="py-2 text-gray-400">{new Date(r.answeredAt).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
