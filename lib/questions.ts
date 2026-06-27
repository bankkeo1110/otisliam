export type Topic = 'addition' | 'subtraction' | 'multiplication' | 'division' | 'fractions' | 'word-problems';

export interface Question {
  question: string;
  answer: string;
  choices: string[];
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeChoices(correct: number, range: number): string[] {
  const wrong = new Set<number>();
  while (wrong.size < 3) {
    const offset = rand(-range, range);
    if (offset !== 0) wrong.add(correct + offset);
  }
  return shuffle([correct, ...wrong].map(String));
}

export function generateQuestion(topic: Topic): Question {
  switch (topic) {
    case 'addition': {
      const a = rand(100, 9999);
      const b = rand(100, 9999);
      return { question: `${a} + ${b} = ?`, answer: String(a + b), choices: makeChoices(a + b, 50) };
    }
    case 'subtraction': {
      const a = rand(500, 9999);
      const b = rand(100, a);
      return { question: `${a} − ${b} = ?`, answer: String(a - b), choices: makeChoices(a - b, 50) };
    }
    case 'multiplication': {
      const a = rand(2, 12);
      const b = rand(2, 99);
      return { question: `${a} × ${b} = ?`, answer: String(a * b), choices: makeChoices(a * b, 20) };
    }
    case 'division': {
      const b = rand(2, 12);
      const result = rand(2, 99);
      const a = b * result;
      return { question: `${a} ÷ ${b} = ?`, answer: String(result), choices: makeChoices(result, 10) };
    }
    case 'fractions': {
      const templates = [
        () => {
          const denom = rand(2, 10);
          const n1 = rand(1, denom - 1);
          const n2 = rand(1, denom - 1);
          const sum = n1 + n2;
          const q = `${n1}/${denom} + ${n2}/${denom} = ?`;
          const ans = sum >= denom ? `${Math.floor(sum/denom)} ${sum%denom}/${denom}`.trim() : `${sum}/${denom}`;
          return { question: q, answer: ans.replace(' 0/', '/') };
        },
        () => {
          const denom = rand(2, 10);
          const n1 = rand(2, denom);
          const n2 = rand(1, n1 - 1);
          return { question: `${n1}/${denom} − ${n2}/${denom} = ?`, answer: `${n1 - n2}/${denom}` };
        },
        () => {
          const whole = rand(1, 9);
          const denom = rand(2, 8);
          const num = rand(1, denom - 1);
          const total = whole * denom + num;
          return { question: `What is ${whole} ${num}/${denom} as an improper fraction?`, answer: `${total}/${denom}` };
        },
      ];
      const t = templates[rand(0, templates.length - 1)]();
      const wrongSet = new Set<string>();
      while (wrongSet.size < 3) {
        const r = rand(1, 9);
        const d = rand(2, 10);
        const w = `${r}/${d}`;
        if (w !== t.answer) wrongSet.add(w);
      }
      return { question: t.question, answer: t.answer, choices: shuffle([t.answer, ...wrongSet]) };
    }
    case 'word-problems': {
      const problems = [
        () => {
          const a = rand(10, 50), b = rand(5, 30);
          return { q: `Sam has ${a} apples and gives away ${b}. How many are left?`, ans: a - b };
        },
        () => {
          const price = rand(5, 20), qty = rand(3, 10);
          return { q: `Each book costs $${price}. How much do ${qty} books cost?`, ans: price * qty };
        },
        () => {
          const total = rand(60, 200), kids = rand(2, 10);
          const share = Math.floor(total / kids);
          return { q: `${total} candies are shared equally among ${kids} children. How many does each get?`, ans: share };
        },
        () => {
          const a = rand(100, 500), b = rand(50, 200);
          return { q: `A store had ${a} items. They received ${b} more. How many total?`, ans: a + b };
        },
        () => {
          const rows = rand(3, 9), cols = rand(3, 9);
          return { q: `A garden has ${rows} rows with ${cols} plants each. How many plants total?`, ans: rows * cols };
        },
      ];
      const p = problems[rand(0, problems.length - 1)]();
      return { question: p.q, answer: String(p.ans), choices: makeChoices(p.ans, 15) };
    }
  }
}

export const TOPICS: { id: Topic; label: string; emoji: string; color: string }[] = [
  { id: 'addition', label: 'Addition', emoji: '➕', color: 'bg-blue-100 border-blue-400 text-blue-800' },
  { id: 'subtraction', label: 'Subtraction', emoji: '➖', color: 'bg-red-100 border-red-400 text-red-800' },
  { id: 'multiplication', label: 'Multiplication', emoji: '✖️', color: 'bg-green-100 border-green-400 text-green-800' },
  { id: 'division', label: 'Division', emoji: '➗', color: 'bg-yellow-100 border-yellow-400 text-yellow-800' },
  { id: 'fractions', label: 'Fractions', emoji: '🔢', color: 'bg-purple-100 border-purple-400 text-purple-800' },
  { id: 'word-problems', label: 'Word Problems', emoji: '📖', color: 'bg-orange-100 border-orange-400 text-orange-800' },
];
