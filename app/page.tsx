import Link from 'next/link';
import { TOPICS } from '@/lib/questions';

export default function Home() {
  return (
    <div className="max-w-3xl mx-auto text-center">
      <div className="mb-10">
        <h1 className="text-5xl font-bold text-blue-700 mb-3">Welcome to Math Fun! 🎉</h1>
        <p className="text-xl text-gray-600">Practice math every day and become a superstar! ⭐</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        {TOPICS.map(t => (
          <Link
            key={t.id}
            href={`/practice?topic=${t.id}`}
            className={`border-2 rounded-2xl p-6 font-bold text-lg hover:scale-105 transition-transform cursor-pointer ${t.color}`}
          >
            <div className="text-4xl mb-2">{t.emoji}</div>
            {t.label}
          </Link>
        ))}
      </div>

      <div className="flex gap-4 justify-center">
        <Link
          href="/practice"
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg transition"
        >
          🚀 Start Practice
        </Link>
        <Link
          href="/report"
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg transition"
        >
          📊 View Reports
        </Link>
      </div>
    </div>
  );
}
