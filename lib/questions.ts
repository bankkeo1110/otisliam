export type Topic =
  | 'place-value'
  | 'addition'
  | 'subtraction'
  | 'multiplication'
  | 'division'
  | 'fractions'
  | 'fraction-simplify'
  | 'fraction-compare'
  | 'fraction-add'
  | 'fraction-subtract'
  | 'fraction-multiply'
  | 'fraction-mixed'
  | 'decimals'
  | 'geometry'
  | 'measurement'
  | 'patterns'
  | 'time'
  | 'word-problems';

export type Category = 'numbers' | 'fractions' | 'measurement-geometry' | 'problem-solving';

export interface Question {
  question: string;
  answer: string;
  choices: string[];
  explanation: string;
}

export interface TopicMeta {
  id: Topic;
  label: string;
  emoji: string;
  color: string;
  category: Category;
  description: string;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5); }
function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick<T>(arr: T[]): T { return arr[rand(0, arr.length - 1)]; }

function gcd(a: number, b: number): number { return b === 0 ? Math.abs(a) : gcd(b, a % b); }
function lcm(a: number, b: number): number { return (a * b) / gcd(a, b); }

function simplifyFrac(num: number, den: number): string {
  if (num === 0) return '0';
  const g = gcd(Math.abs(num), den);
  return den / g === 1 ? String(num / g) : `${num / g}/${den / g}`;
}

function toMixed(num: number, den: number): string {
  const s = simplifyFrac(num, den);
  if (!s.includes('/')) return s;
  const [n, d] = s.split('/').map(Number);
  if (n < d) return s;
  const whole = Math.floor(n / d);
  const rem = n % d;
  return rem === 0 ? String(whole) : `${whole} ${rem}/${d}`;
}

/** numeric choices around a correct value */
function makeChoices(correct: number, range: number): string[] {
  const r = Math.max(range, 3); // need at least 3 to guarantee 3 unique positives
  const wrong = new Set<number>();
  while (wrong.size < 3) {
    const offset = rand(-r, r);
    const v = correct + offset;
    if (offset !== 0 && v > 0) wrong.add(v);
  }
  return shuffle([correct, ...wrong].map(String));
}

/** fraction / string choices with explicit distractors */
function makeFracChoices(correct: string, distractors: string[]): string[] {
  const set = new Set<string>();
  for (const d of shuffle(distractors)) {
    if (d !== correct) set.add(d);
    if (set.size >= 3) break;
  }
  while (set.size < 3) {
    const n = rand(1, 11), d = rand(2, 12);
    const w = `${n}/${d}`;
    if (w !== correct) set.add(w);
  }
  return shuffle([correct, ...set]);
}

// ─── generators ──────────────────────────────────────────────────────────────

function genPlaceValue(): Question {
  return pick<() => Question>([
    () => {
      const n = rand(1000, 99999);
      const roundTo = pick([10, 100, 1000]);
      const ans = Math.round(n / roundTo) * roundTo;
      const placeName = roundTo === 10 ? 'ones' : roundTo === 100 ? 'tens' : 'hundreds';
      const remainder = n % roundTo;
      return {
        question: `Round ${n.toLocaleString()} to the nearest ${roundTo.toLocaleString()}.`,
        answer: String(ans),
        choices: makeChoices(ans, roundTo),
        explanation: `Look at the ${placeName} digit of ${n.toLocaleString()}. It's ${Math.floor(remainder / (roundTo / 10))}, which is ${remainder >= roundTo / 2 ? 'at least 5, so round up' : 'less than 5, so round down'} to ${ans.toLocaleString()}.`,
      };
    },
    () => {
      const digits = [rand(1,9), rand(0,9), rand(0,9), rand(0,9), rand(1,9)];
      const n = parseInt(digits.join(''));
      const positions = ['ten-thousands', 'thousands', 'hundreds', 'tens', 'ones'];
      const pos = rand(0, 4);
      const values = [10000, 1000, 100, 10, 1];
      const ans = digits[pos] * values[pos];
      return {
        question: `What is the value of the digit ${digits[pos]} in ${n.toLocaleString()}?`,
        answer: String(ans),
        choices: makeChoices(ans, ans),
        explanation: `The digit ${digits[pos]} is in the ${positions[pos]} place. Its value is ${digits[pos]} × ${values[pos].toLocaleString()} = ${ans.toLocaleString()}.`,
      };
    },
    () => {
      const a = rand(10000, 99999), b = rand(10000, 99999);
      const bigger = Math.max(a, b);
      return {
        question: `Which number is greater: ${a.toLocaleString()} or ${b.toLocaleString()}?`,
        answer: String(bigger),
        choices: shuffle([String(a), String(b), String(bigger + rand(1,100)), String(Math.min(a,b) - rand(1,100))]),
        explanation: `Compare digit by digit from the leftmost place. ${bigger.toLocaleString()} has a larger value, so it is greater.`,
      };
    },
    () => {
      const thousands = rand(1,9), hundreds = rand(0,9), tens = rand(0,9), ones = rand(0,9);
      const n = thousands*1000 + hundreds*100 + tens*10 + ones;
      const expanded = [thousands ? `${thousands},000` : '', hundreds ? `${hundreds*100}` : '', tens ? `${tens*10}` : '', ones ? `${ones}` : ''].filter(Boolean).join(' + ');
      return {
        question: `What is ${expanded}?`,
        answer: String(n),
        choices: makeChoices(n, 500),
        explanation: `Add all the parts together: ${expanded} = ${n.toLocaleString()}.`,
      };
    },
    () => {
      const n = rand(100, 9999);
      const ans = Math.round(n/100)*100;
      const tensDigit = Math.floor((n % 100) / 10);
      return {
        question: `What is ${n.toLocaleString()} rounded to the nearest hundred?`,
        answer: String(ans),
        choices: makeChoices(ans, 200),
        explanation: `Look at the tens digit of ${n}: it's ${tensDigit}. Since ${tensDigit} is ${tensDigit >= 5 ? 'at least 5, round up' : 'less than 5, round down'} to the nearest hundred: ${ans}.`,
      };
    },
  ])();
}

function genAddition(): Question {
  const type = rand(0, 2);
  if (type === 0) {
    const a = rand(1000, 9999), b = rand(1000, 9999);
    return {
      question: `${a.toLocaleString()} + ${b.toLocaleString()} = ?`,
      answer: String(a+b),
      choices: makeChoices(a+b, 200),
      explanation: `Stack the numbers and add column by column from right to left, carrying when a column exceeds 9. ${a.toLocaleString()} + ${b.toLocaleString()} = ${(a+b).toLocaleString()}.`,
    };
  }
  if (type === 1) {
    const a = rand(10000, 99999), b = rand(1000, 9999);
    return {
      question: `${a.toLocaleString()} + ${b.toLocaleString()} = ?`,
      answer: String(a+b),
      choices: makeChoices(a+b, 500),
      explanation: `Align the digits by place value and add each column from right to left. ${a.toLocaleString()} + ${b.toLocaleString()} = ${(a+b).toLocaleString()}.`,
    };
  }
  const a = rand(100, 999), b = rand(100, 999), c = rand(100, 999);
  return {
    question: `${a} + ${b} + ${c} = ?`,
    answer: String(a+b+c),
    choices: makeChoices(a+b+c, 100),
    explanation: `Add left to right: ${a} + ${b} = ${a+b}, then ${a+b} + ${c} = ${a+b+c}.`,
  };
}

function genSubtraction(): Question {
  const type = rand(0, 1);
  if (type === 0) {
    const a = rand(1000, 9999), b = rand(100, a);
    return {
      question: `${a.toLocaleString()} − ${b.toLocaleString()} = ?`,
      answer: String(a-b),
      choices: makeChoices(a-b, 200),
      explanation: `Subtract column by column from right to left, borrowing from the next column when needed. ${a.toLocaleString()} − ${b.toLocaleString()} = ${(a-b).toLocaleString()}.`,
    };
  }
  const a = rand(10000, 99999), b = rand(1000, a-100);
  return {
    question: `${a.toLocaleString()} − ${b.toLocaleString()} = ?`,
    answer: String(a-b),
    choices: makeChoices(a-b, 500),
    explanation: `Align the numbers and subtract column by column from right to left. ${a.toLocaleString()} − ${b.toLocaleString()} = ${(a-b).toLocaleString()}.`,
  };
}

function genMultiplication(): Question {
  const type = rand(0, 2);
  if (type === 0) {
    const a = rand(2, 12), b = rand(2, 12);
    return {
      question: `${a} × ${b} = ?`,
      answer: String(a*b),
      choices: makeChoices(a*b, 15),
      explanation: `Think of it as ${a} groups of ${b}: ${Array.from({length: Math.min(a,5)}, () => b).join(' + ')}${a > 5 ? ' + ...' : ''} = ${a*b}. Or recall your times table: ${a} × ${b} = ${a*b}.`,
    };
  }
  if (type === 1) {
    const a = rand(10, 99), b = rand(2, 12);
    const tens = Math.floor(a/10)*10, ones = a % 10;
    return {
      question: `${a} × ${b} = ?`,
      answer: String(a*b),
      choices: makeChoices(a*b, 30),
      explanation: `Break ${a} into ${tens} + ${ones}: (${tens} × ${b}) + (${ones} × ${b}) = ${tens*b} + ${ones*b} = ${a*b}.`,
    };
  }
  const a = rand(10, 99), b = rand(10, 99);
  return {
    question: `${a} × ${b} = ?`,
    answer: String(a*b),
    choices: makeChoices(a*b, 100),
    explanation: `Use long multiplication: ${a} × ${b} = ${a*b}. (Break apart: ${a} × ${Math.floor(b/10)*10} = ${a*Math.floor(b/10)*10}, ${a} × ${b%10} = ${a*(b%10)}, total = ${a*b}.)`,
  };
}

function genDivision(): Question {
  const type = rand(0, 1);
  if (type === 0) {
    const b = rand(2,12), result = rand(2,99); const a = b*result;
    return {
      question: `${a} ÷ ${b} = ?`,
      answer: String(result),
      choices: makeChoices(result, 10),
      explanation: `Ask: how many times does ${b} go into ${a}? ${b} × ${result} = ${a}, so the answer is ${result}.`,
    };
  }
  const b = rand(2,9), q = rand(2,20), r = rand(1, b-1); const a = b*q+r;
  return {
    question: `${a} ÷ ${b} = ? (give quotient and remainder as "Q R#")`,
    answer: `${q} R${r}`,
    choices: shuffle([`${q} R${r}`, `${q+1} R${r}`, `${q} R${r+1}`, `${q-1} R${r}`]),
    explanation: `${b} × ${q} = ${b*q}. Subtract: ${a} − ${b*q} = ${r}. Since ${r} < ${b}, stop here. Answer: quotient ${q}, remainder ${r}.`,
  };
}

// ─── FRACTIONS ───────────────────────────────────────────────────────────────

function genFractionsMix(): Question {
  return pick<() => Question>([
    () => {
      const d = rand(2,10), n1 = rand(1,d-1), n2 = rand(1,d-1), sum = n1+n2;
      const ans = sum >= d ? toMixed(sum, d) : `${sum}/${d}`;
      const expPart = sum >= d
        ? `${sum}/${d} is improper — convert: ${Math.floor(sum/d)} remainder ${sum%d}, so the answer is ${ans}.`
        : `The answer is ${ans}.`;
      return {
        question: `${n1}/${d} + ${n2}/${d} = ?`,
        answer: ans,
        choices: makeFracChoices(ans, [`${sum+1}/${d}`, `${sum-1}/${d}`, `${n1*n2}/${d}`]),
        explanation: `Same denominator — add the numerators: ${n1} + ${n2} = ${sum}, keep the denominator ${d}. ${expPart}`,
      };
    },
    () => {
      const d = rand(2,10), n1 = rand(2,d), n2 = rand(1,n1-1);
      const ans = simplifyFrac(n1-n2, d);
      const g = gcd(n1-n2, d);
      const simpNote = g > 1 ? ` Simplify: divide both by ${g} → ${ans}.` : '';
      return {
        question: `${n1}/${d} − ${n2}/${d} = ?`,
        answer: ans,
        choices: makeFracChoices(ans, [`${n1+n2}/${d}`, `${n1-n2+1}/${d}`, `${n1}/${d+1}`]),
        explanation: `Same denominator — subtract the numerators: ${n1} − ${n2} = ${n1-n2}, keep the denominator ${d}: ${n1-n2}/${d}.${simpNote}`,
      };
    },
    () => {
      const w = rand(1,9), d = rand(2,8), n = rand(1,d-1), total = w*d+n;
      const ans = `${total}/${d}`;
      return {
        question: `Convert ${w} ${n}/${d} to an improper fraction.`,
        answer: ans,
        choices: makeFracChoices(ans, [`${total-1}/${d}`, `${total+1}/${d}`, `${w*n}/${d}`]),
        explanation: `Multiply whole number by denominator: ${w} × ${d} = ${w*d}. Add the numerator: ${w*d} + ${n} = ${total}. Put over the same denominator: ${total}/${d}.`,
      };
    },
    () => {
      const d = rand(2,8), n = rand(d+1, d*5);
      const ans = toMixed(n, d);
      const whole = Math.floor(n/d), rem = n % d;
      const remNote = rem === 0 ? `It divides evenly, so the answer is ${whole}.` : `Remainder is ${rem}, so the answer is ${whole} ${rem}/${d}.`;
      return {
        question: `Convert ${n}/${d} to a mixed number.`,
        answer: ans,
        choices: makeFracChoices(ans, [`${Math.floor(n/d)} ${n%d+1}/${d}`, `${Math.floor(n/d)+1} ${n%d}/${d}`, `${Math.floor(n/d)} ${n%d-1}/${d}`].filter(x => !x.includes('/-') && !x.includes('/0'))),
        explanation: `Divide ${n} ÷ ${d} = ${whole} remainder ${rem}. ${remNote}`,
      };
    },
  ])();
}

function genFractionSimplify(): Question {
  const dens = [4,6,8,9,10,12,15,16,18,20];
  let num: number, den: number;
  do { den = pick(dens); num = rand(2, den-1); } while (gcd(num, den) === 1 || num === den);
  const ans = simplifyFrac(num, den);
  const g = gcd(num, den);
  const distractors = [
    `${num/g + 1}/${den/g}`,
    `${num/g}/${den/g + 1}`,
    `${num}/${den + 2}`,
    `${num - 1}/${den}`,
  ];
  return {
    question: `Simplify ${num}/${den} to its lowest terms.`,
    answer: ans,
    choices: makeFracChoices(ans, distractors),
    explanation: `Find the GCD of ${num} and ${den}: it is ${g}. Divide both by ${g}: ${num}÷${g} = ${num/g} and ${den}÷${g} = ${den/g}. Answer: ${ans}.`,
  };
}

function genFractionCompare(): Question {
  const pairs: [number,number,number,number][] = [
    [1,2, 1,3], [2,3, 3,4], [1,4, 1,3], [3,5, 2,3],
    [5,8, 3,5], [1,2, 2,5], [3,4, 5,8], [2,5, 3,7],
    [1,3, 2,6], [3,4, 6,8],
  ];
  const [a,b,c,d] = pick(pairs);
  const left = a/b, right = c/d;
  const ans = left > right ? '>' : left < right ? '<' : '=';
  const L = lcm(b, d);
  const leftN = a * (L/b), rightN = c * (L/d);
  const explanation = leftN === rightN
    ? `Convert to the same denominator (${L}): ${a}/${b} = ${leftN}/${L} and ${c}/${d} = ${rightN}/${L}. The numerators are equal, so ${a}/${b} = ${c}/${d}.`
    : `Convert to the same denominator (${L}): ${a}/${b} = ${leftN}/${L} and ${c}/${d} = ${rightN}/${L}. Compare: ${leftN} ${ans} ${rightN}, so ${a}/${b} ${ans} ${c}/${d}.`;
  return {
    question: `Compare: ${a}/${b}  ___  ${c}/${d}`,
    answer: ans,
    choices: shuffle(['>', '<', '=', '≈']),
    explanation,
  };
}

function genFractionAdd(): Question {
  const type = rand(0, 1);
  if (type === 0) {
    const d = rand(2,12), n1 = rand(1,d-1), n2 = rand(1,d-1);
    const sum = n1+n2;
    const ans = sum >= d ? toMixed(sum, d) : simplifyFrac(sum, d);
    const g = gcd(sum, d);
    const simpNote = sum < d && g > 1 ? ` Simplify by dividing by ${g}: ${ans}.` : '';
    const improperNote = sum >= d ? ` Convert ${sum}/${d} to mixed number: ${ans}.` : '';
    return {
      question: `${n1}/${d} + ${n2}/${d} = ?`,
      answer: ans,
      choices: makeFracChoices(ans, [`${sum+1}/${d}`, `${(n1+n2+1)}/${d}`, `${n1*n2}/${d*d}`]),
      explanation: `Same denominator — add numerators: ${n1} + ${n2} = ${sum}, keep /${d}: ${sum}/${d}.${simpNote}${improperNote}`,
    };
  }
  const pairs = [[1,2,1,3],[1,3,1,4],[1,4,1,5],[2,3,1,4],[1,2,1,4],[1,3,1,6],[3,4,1,8],[1,2,3,8]];
  const [n1,d1,n2,d2] = pick(pairs);
  const L = lcm(d1,d2);
  const e1 = n1*(L/d1), e2 = n2*(L/d2);
  const num = e1 + e2;
  const ans = toMixed(num, L);
  return {
    question: `${n1}/${d1} + ${n2}/${d2} = ?`,
    answer: ans,
    choices: makeFracChoices(ans, [`${n1+n2}/${d1+d2}`, `${num+1}/${L}`, `${num-1}/${L}`]),
    explanation: `Find the LCD of ${d1} and ${d2}: it's ${L}. Convert: ${n1}/${d1} = ${e1}/${L} and ${n2}/${d2} = ${e2}/${L}. Add: ${e1} + ${e2} = ${num}, so ${num}/${L} = ${ans}.`,
  };
}

function genFractionSubtract(): Question {
  const type = rand(0, 1);
  if (type === 0) {
    const d = rand(2,12), n1 = rand(2,d), n2 = rand(1,n1-1);
    const ans = simplifyFrac(n1-n2, d);
    const g = gcd(n1-n2, d);
    const simpNote = g > 1 ? ` Simplify by dividing by ${g}: ${ans}.` : '';
    return {
      question: `${n1}/${d} − ${n2}/${d} = ?`,
      answer: ans,
      choices: makeFracChoices(ans, [`${n1+n2}/${d}`, `${n1-n2+1}/${d}`, `${n2}/${d}`]),
      explanation: `Same denominator — subtract numerators: ${n1} − ${n2} = ${n1-n2}, keep /${d}: ${n1-n2}/${d}.${simpNote}`,
    };
  }
  const pairs = [[3,4,1,2],[5,6,1,3],[3,4,1,8],[2,3,1,4],[5,8,1,4],[7,8,1,2],[3,5,1,10]];
  const [n1,d1,n2,d2] = pick(pairs);
  const L = lcm(d1,d2);
  const e1 = n1*(L/d1), e2 = n2*(L/d2);
  const num = e1 - e2;
  const ans = simplifyFrac(num, L);
  const g = gcd(num, L);
  const simpNote = g > 1 ? ` Simplify: ${ans}.` : '';
  return {
    question: `${n1}/${d1} − ${n2}/${d2} = ?`,
    answer: ans,
    choices: makeFracChoices(ans, [`${n1-n2}/${d1-d2}`, `${num+1}/${L}`, `${n1+n2}/${d1}`]),
    explanation: `Find the LCD of ${d1} and ${d2}: it's ${L}. Convert: ${n1}/${d1} = ${e1}/${L} and ${n2}/${d2} = ${e2}/${L}. Subtract: ${e1} − ${e2} = ${num}, so ${num}/${L}.${simpNote}`,
  };
}

function genFractionMultiply(): Question {
  return pick<() => Question>([
    () => {
      const pairs = [[1,2,1,3],[2,3,3,4],[1,4,2,3],[3,5,1,2],[2,5,3,4],[1,3,3,4],[2,3,1,5]];
      const [n1,d1,n2,d2] = pick(pairs);
      const ans = simplifyFrac(n1*n2, d1*d2);
      const g = gcd(n1*n2, d1*d2);
      const simpNote = g > 1 ? ` Simplify by dividing by ${g}: ${ans}.` : '';
      return {
        question: `${n1}/${d1} × ${n2}/${d2} = ?`,
        answer: ans,
        choices: makeFracChoices(ans, [`${n1*n2}/${d1+d2}`, `${n1+n2}/${d1*d2}`, `${n1*d2}/${d1*n2}`]),
        explanation: `Multiply the numerators: ${n1} × ${n2} = ${n1*n2}. Multiply the denominators: ${d1} × ${d2} = ${d1*d2}. Result: ${n1*n2}/${d1*d2}.${simpNote}`,
      };
    },
    () => {
      const n = rand(1,5), d = rand(2,8), w = rand(2,10);
      const ans = simplifyFrac(n*w, d);
      const g = gcd(n*w, d);
      const simpNote = g > 1 ? ` Simplify: ${ans}.` : '';
      return {
        question: `${n}/${d} × ${w} = ?`,
        answer: ans,
        choices: makeFracChoices(ans, [`${n}/${d*w}`, `${n+w}/${d}`, `${n*w+1}/${d}`]),
        explanation: `Multiply the numerator by the whole number: ${n} × ${w} = ${n*w}. Keep the denominator: ${n*w}/${d}.${simpNote}`,
      };
    },
  ])();
}

function genFractionMixed(): Question {
  return pick<() => Question>([
    () => {
      const w = rand(1,5), d = rand(2,8), n = rand(1,d-1), total = w*d+n;
      return {
        question: `Convert ${w} ${n}/${d} to an improper fraction.`,
        answer: `${total}/${d}`,
        choices: makeFracChoices(`${total}/${d}`, [`${total-1}/${d}`,`${total+1}/${d}`,`${w*n}/${d}`]),
        explanation: `Multiply whole × denominator: ${w} × ${d} = ${w*d}. Add numerator: ${w*d} + ${n} = ${total}. Answer: ${total}/${d}.`,
      };
    },
    () => {
      const d = rand(2,8), n = rand(d+1, d*4);
      const ans = toMixed(n, d);
      const whole = Math.floor(n/d), rem = n % d;
      const remNote = rem === 0 ? `It divides evenly: ${whole}.` : `Remainder is ${rem}: answer is ${whole} ${rem}/${d}.`;
      return {
        question: `Convert the improper fraction ${n}/${d} to a mixed number.`,
        answer: ans,
        choices: makeFracChoices(ans, [`${Math.floor(n/d)+1} ${n%d}/${d}`, `${Math.floor(n/d)} ${(n%d)+1}/${d}`, `${Math.floor(n/d)-1} ${n%d}/${d}`].filter(x => !x.startsWith('-') && !x.includes('0/'))),
        explanation: `Divide ${n} ÷ ${d} = ${whole} remainder ${rem}. ${remNote}`,
      };
    },
    () => {
      const w1=rand(1,4), d=rand(2,6), n1=rand(1,d-1), w2=rand(1,4), n2=rand(1,d-1);
      const totN = (w1+w2)*d + n1+n2;
      const ans = toMixed(totN, d);
      return {
        question: `${w1} ${n1}/${d} + ${w2} ${n2}/${d} = ?`,
        answer: ans,
        choices: makeFracChoices(ans, [`${w1+w2} ${n1+n2+1}/${d}`, `${w1+w2-1} ${n1+n2}/${d}`, `${w1+w2+1} ${(n1+n2)%d}/${d}`]),
        explanation: `Add whole numbers: ${w1} + ${w2} = ${w1+w2}. Add fractions: ${n1}/${d} + ${n2}/${d} = ${n1+n2}/${d}. Combine and simplify: ${ans}.`,
      };
    },
  ])();
}

// ─── DECIMALS ────────────────────────────────────────────────────────────────

function genDecimals(): Question {
  return pick<() => Question>([
    () => {
      const a = rand(10, 99)/10, b = rand(10,99)/10;
      const ans = parseFloat((a+b).toFixed(1));
      return {
        question: `${a} + ${b} = ?`,
        answer: String(ans),
        choices: makeChoices(ans*10, 5).map(x => String(Number(x)/10)),
        explanation: `Line up the decimal points and add: ${a} + ${b} = ${ans}.`,
      };
    },
    () => {
      const a = rand(20,99)/10, b = rand(10, (rand(20,99)))/10;
      const diff = parseFloat((Math.max(a,b) - Math.min(a,b)).toFixed(1));
      return {
        question: `${Math.max(a,b)} − ${Math.min(a,b)} = ?`,
        answer: String(diff),
        choices: makeChoices(diff*10, 5).map(x => String(Number(x)/10)),
        explanation: `Line up the decimal points and subtract: ${Math.max(a,b)} − ${Math.min(a,b)} = ${diff}.`,
      };
    },
    () => {
      const n = (rand(10,99)/10);
      const ans = Math.round(n);
      const dec = n - Math.floor(n);
      return {
        question: `Round ${n} to the nearest whole number.`,
        answer: String(ans),
        choices: shuffle([ans, ans+1, ans > 1 ? ans-1 : ans+3, ans+2].map(String)),
        explanation: `Look at the decimal part (${dec.toFixed(1)}). Since it is ${dec >= 0.5 ? 'at least 0.5, round up' : 'less than 0.5, round down'} to ${ans}.`,
      };
    },
    () => {
      const pairs = [[0.5,0.75],[0.3,0.25],[0.6,0.65],[0.4,0.45],[0.8,0.75],[1.2,1.25],[0.9,0.09],[0.7,0.71]];
      const [a,b] = pick(pairs);
      const ans = a > b ? `${a}` : a < b ? `${b}` : 'equal';
      const choicePool = [...new Set([String(a), String(b), 'equal', String(parseFloat((Math.max(a,b)+0.1).toFixed(2)))])];
      while (choicePool.length < 4) choicePool.push(String(parseFloat((Math.max(a,b)+0.2*choicePool.length).toFixed(2))));
      return {
        question: `Which decimal is greater: ${a} or ${b}?`,
        answer: ans,
        choices: shuffle(choicePool.slice(0, 4)),
        explanation: `Compare digit by digit after the decimal point. ${a} ${a > b ? '>' : a < b ? '<' : '='} ${b}${a === b ? ', they are equal' : `, so ${ans} is greater`}.`,
      };
    },
    () => {
      const fracs: [string,string][] = [['1/4','0.25'],['1/2','0.5'],['3/4','0.75'],['1/5','0.2'],['2/5','0.4'],['1/10','0.1'],['3/5','0.6'],['4/5','0.8']];
      const [frac, dec] = pick(fracs);
      const [fn, fd] = frac.split('/').map(Number);
      return {
        question: `What is ${frac} as a decimal?`,
        answer: dec,
        choices: (() => {
          const d = parseFloat(dec);
          const opts = [String(d+0.1), String(d+0.25), d >= 0.15 ? String(parseFloat((d-0.1).toFixed(2))) : String(d+0.5)];
          return shuffle([dec, ...opts]);
        })(),
        explanation: `Divide the numerator by the denominator: ${fn} ÷ ${fd} = ${dec}.`,
      };
    },
    () => {
      const a = rand(100,999)/100, b = rand(100,999)/100;
      const ans = parseFloat((a+b).toFixed(2));
      return {
        question: `${a} + ${b} = ?`,
        answer: String(ans),
        choices: makeChoices(Math.round(ans*100), 10).map(x => String(Number(x)/100)),
        explanation: `Line up the decimal points and add each column: ${a} + ${b} = ${ans}.`,
      };
    },
  ])();
}

// ─── GEOMETRY ────────────────────────────────────────────────────────────────

function genGeometry(): Question {
  return pick<() => Question>([
    () => {
      const l = rand(2,15), w = rand(2,l);
      return {
        question: `A rectangle is ${l} cm long and ${w} cm wide. What is its AREA?`,
        answer: String(l*w),
        choices: makeChoices(l*w, Math.max(5, Math.floor(l*w*0.3))),
        explanation: `Area of a rectangle = length × width = ${l} × ${w} = ${l*w} cm².`,
      };
    },
    () => {
      const l = rand(2,15), w = rand(2,l);
      return {
        question: `A rectangle is ${l} cm long and ${w} cm wide. What is its PERIMETER?`,
        answer: String(2*(l+w)),
        choices: makeChoices(2*(l+w), 10),
        explanation: `Perimeter = 2 × (length + width) = 2 × (${l} + ${w}) = 2 × ${l+w} = ${2*(l+w)} cm.`,
      };
    },
    () => {
      const s = rand(2,12);
      return {
        question: `A square has sides of ${s} cm. What is its area?`,
        answer: String(s*s),
        choices: makeChoices(s*s, 20),
        explanation: `Area of a square = side × side = ${s} × ${s} = ${s*s} cm².`,
      };
    },
    () => {
      const s = rand(2,12);
      return {
        question: `A square has sides of ${s} cm. What is its perimeter?`,
        answer: String(4*s),
        choices: makeChoices(4*s, 8),
        explanation: `Perimeter of a square = 4 × side = 4 × ${s} = ${4*s} cm. (All 4 sides are equal.)`,
      };
    },
    () => {
      const area = rand(2,10) * rand(2,10), w = rand(2,8);
      if (area % w !== 0) {
        const l2 = rand(2,12), w2 = rand(2,12);
        return {
          question: `Area of rectangle = ${l2*w2} cm². Width = ${w2} cm. What is the length?`,
          answer: String(l2),
          choices: makeChoices(l2, 5),
          explanation: `Length = Area ÷ Width = ${l2*w2} ÷ ${w2} = ${l2} cm.`,
        };
      }
      return {
        question: `Area of rectangle = ${area} cm². Width = ${w} cm. What is the length?`,
        answer: String(area/w),
        choices: makeChoices(area/w, 5),
        explanation: `Length = Area ÷ Width = ${area} ÷ ${w} = ${area/w} cm.`,
      };
    },
    () => {
      const angles: [number,string][] = [[90,'right angle'],[180,'straight angle'],[45,'acute angle'],[120,'obtuse angle'],[60,'acute angle'],[150,'obtuse angle']];
      const [deg, name] = pick(angles);
      return {
        question: `An angle measures ${deg}°. What type of angle is it?`,
        answer: name,
        choices: shuffle(['right angle','acute angle','obtuse angle','straight angle']),
        explanation: `Right angle = 90°, acute angle < 90°, obtuse angle is between 90° and 180°, straight angle = 180°. Since ${deg}° is ${deg === 90 ? 'exactly 90°' : deg === 180 ? 'exactly 180°' : deg < 90 ? 'less than 90°' : 'between 90° and 180°'}, it is a ${name}.`,
      };
    },
    () => {
      const shapes: [string,number][] = [['triangle',3],['quadrilateral',4],['pentagon',5],['hexagon',6],['octagon',8]];
      const [name, sides] = pick(shapes);
      return {
        question: `How many sides does a ${name} have?`,
        answer: String(sides),
        choices: shuffle([String(sides), ...shuffle(['3','4','5','6','7','8'].filter(s => s !== String(sides))).slice(0, 3)]),
        explanation: `A ${name} has ${sides} sides by definition. (tri=3, quad=4, penta=5, hexa=6, octa=8)`,
      };
    },
  ])();
}

// ─── MEASUREMENT ─────────────────────────────────────────────────────────────

function genMeasurement(): Question {
  return pick<() => Question>([
    () => {
      const m = rand(1,10);
      return {
        question: `How many centimeters are in ${m} meter${m>1?'s':''}?`,
        answer: String(m*100),
        choices: makeChoices(m*100, 50),
        explanation: `1 meter = 100 centimeters. So ${m} m × 100 = ${m*100} cm.`,
      };
    },
    () => {
      const km = rand(1,8);
      return {
        question: `How many meters are in ${km} kilometer${km>1?'s':''}?`,
        answer: String(km*1000),
        choices: makeChoices(km*1000, 200),
        explanation: `1 kilometer = 1,000 meters. So ${km} km × 1,000 = ${km*1000} m.`,
      };
    },
    () => {
      const kg = rand(1,10);
      return {
        question: `How many grams are in ${kg} kilogram${kg>1?'s':''}?`,
        answer: String(kg*1000),
        choices: makeChoices(kg*1000, 200),
        explanation: `1 kilogram = 1,000 grams. So ${kg} kg × 1,000 = ${kg*1000} g.`,
      };
    },
    () => {
      const L = rand(1,8);
      return {
        question: `How many milliliters are in ${L} liter${L>1?'s':''}?`,
        answer: String(L*1000),
        choices: makeChoices(L*1000, 200),
        explanation: `1 liter = 1,000 milliliters. So ${L} L × 1,000 = ${L*1000} mL.`,
      };
    },
    () => {
      const cm = pick([100,200,300,400,500,150,250]);
      return {
        question: `${cm} centimeters = ___ meters`,
        answer: String(cm/100),
        choices: shuffle([String(cm/100), String(cm/100+1), String(cm/10), String(cm)]),
        explanation: `Divide by 100 to convert cm to meters: ${cm} ÷ 100 = ${cm/100} m.`,
      };
    },
    () => {
      const g = pick([1000,2000,3000,500,1500,2500]);
      const ans = g >= 1000 ? `${g/1000} kg` : `${g} g`;
      return {
        question: `Which is the same as ${g < 1000 ? g + ' g' : g/1000 + ' kg'}?`,
        answer: ans,
        choices: shuffle([ans, `${g/1000+1} kg`, `${g+100} g`, `${g*10} g`].filter(x=>x!==ans).slice(0,3).concat([ans])),
        explanation: `1 kg = 1,000 g. ${g < 1000 ? `${g} g ÷ 1,000 = ${g/1000} kg` : `${g/1000} kg × 1,000 = ${g} g`}. The equivalent is ${ans}.`,
      };
    },
    () => {
      const l = rand(2,15), w = rand(2,l); const perim = 2*(l+w);
      return {
        question: `A garden is ${l} m long and ${w} m wide. What length of fence is needed to go all the way around?`,
        answer: `${perim} m`,
        choices: makeChoices(perim, 4).map(v => `${v} m`),
        explanation: `Fencing around the perimeter = 2 × (length + width) = 2 × (${l} + ${w}) = 2 × ${l+w} = ${perim} m.`,
      };
    },
  ])();
}

// ─── PATTERNS ────────────────────────────────────────────────────────────────

function genPatterns(): Question {
  return pick<() => Question>([
    () => {
      const start = rand(2,20), step = rand(2,10);
      const seq = [start, start+step, start+2*step, start+3*step];
      return {
        question: `What comes next?\n${seq.join(', ')}, ___`,
        answer: String(start+4*step),
        choices: makeChoices(start+4*step, step+2),
        explanation: `The pattern adds ${step} each time: ${seq.join(' → ')} → ${start+4*step}.`,
      };
    },
    () => {
      const start = rand(1,5), mult = pick([2,3,4]);
      const seq = [start, start*mult, start*mult*mult, start*mult*mult*mult];
      return {
        question: `What comes next? (×${mult} each time)\n${seq.join(', ')}, ___`,
        answer: String(seq[3]*mult),
        choices: makeChoices(seq[3]*mult, seq[3]),
        explanation: `The pattern multiplies by ${mult} each time: ${seq.join(' → ')} → ${seq[3]} × ${mult} = ${seq[3]*mult}.`,
      };
    },
    () => {
      const b = rand(2,9), factor = rand(2,12), product = b*factor;
      return {
        question: `${b} × ___ = ${product}`,
        answer: String(factor),
        choices: makeChoices(factor, 4),
        explanation: `Find the missing factor: ${product} ÷ ${b} = ${factor}. Check: ${b} × ${factor} = ${product} ✓`,
      };
    },
    () => {
      const factor = rand(2,12), product = factor * rand(2,9), b = product/factor;
      return {
        question: `___ × ${factor} = ${product}`,
        answer: String(b),
        choices: makeChoices(b, 4),
        explanation: `Find the missing factor: ${product} ÷ ${factor} = ${b}. Check: ${b} × ${factor} = ${product} ✓`,
      };
    },
    () => {
      const b = rand(2,9), divisor = rand(2,9), quotient = b*divisor;
      return {
        question: `${quotient} ÷ ___ = ${b}`,
        answer: String(divisor),
        choices: makeChoices(divisor, 3),
        explanation: `Find the missing divisor: ${quotient} ÷ ${b} = ${divisor}. Check: ${quotient} ÷ ${divisor} = ${b} ✓`,
      };
    },
    () => {
      const step = rand(5, 25);
      const start = rand(Math.max(50, step * 5 + 1), 200);
      const seq = [start, start-step, start-2*step, start-3*step];
      return {
        question: `What comes next? (decreasing pattern)\n${seq.join(', ')}, ___`,
        answer: String(start-4*step),
        choices: makeChoices(start-4*step, step+2),
        explanation: `The pattern subtracts ${step} each time: ${seq.join(' → ')} → ${start-3*step} − ${step} = ${start-4*step}.`,
      };
    },
    () => {
      const inputs = [rand(1,5), rand(6,10), rand(11,15)];
      const rule = rand(3,8);
      const outputs = inputs.map(x => x*rule);
      return {
        question: `Rule: multiply by ___\nIn: ${inputs[0]} → Out: ${outputs[0]}\nIn: ${inputs[1]} → Out: ${outputs[1]}\nIn: ${inputs[2]} → Out: ?`,
        answer: String(outputs[2]),
        choices: makeChoices(outputs[2], rule*2),
        explanation: `Find the rule: ${outputs[0]} ÷ ${inputs[0]} = ${rule}. The rule is ×${rule}. So ${inputs[2]} × ${rule} = ${outputs[2]}.`,
      };
    },
  ])();
}

// ─── TIME ────────────────────────────────────────────────────────────────────

function genTime(): Question {
  return pick<() => Question>([
    () => {
      const startH = rand(7,11), endH = rand(startH+1, Math.min(startH+6, 17));
      const diff = endH - startH;
      return {
        question: `School starts at ${startH}:00 AM and ends at ${endH > 12 ? endH-12 : endH}:00 ${endH >= 12 ? 'PM' : 'AM'}.\nHow many hours is that?`,
        answer: String(diff),
        choices: makeChoices(diff, 2),
        explanation: `Count the hours from ${startH}:00 to ${endH}:00: that is ${diff} hours.`,
      };
    },
    () => {
      const h = rand(1,11), m = pick([0,15,30,45]), addM = pick([15,20,25,30,40,45]);
      const totalM = m + addM;
      const endH = h + Math.floor(totalM/60);
      const endM = totalM % 60;
      const startStr = `${h}:${String(m).padStart(2,'0')}`;
      const endStr = `${endH}:${String(endM).padStart(2,'0')}`;
      const wrongA = `${endH}:${String(endM+5).padStart(2,'0')}`;
      const wrongB = `${endH}:${String(Math.max(0,endM-5)).padStart(2,'0')}`;
      const wrongC = `${endH+1}:${String(endM).padStart(2,'0')}`;
      return {
        question: `It is ${startStr}. You study for ${addM} minutes. What time will it be?`,
        answer: endStr,
        choices: shuffle([endStr, wrongA, wrongB, wrongC]),
        explanation: `Start at ${startStr}. Add ${addM} minutes: ${m} + ${addM} = ${totalM} minutes total. ${totalM >= 60 ? `That's ${Math.floor(totalM/60)} hour and ${endM} minutes past ${h}:00, so ` : ''}the time is ${endStr}.`,
      };
    },
    () => {
      const startH = rand(8,11), startM = pick([0,15,30]), endH = rand(startH, startH+3), endM = pick([0,15,30,45]);
      const totalS = startH*60+startM, totalE = endH*60+endM;
      if (totalE <= totalS) {
        return {
          question: `A movie is 1 hour long. It starts at 3:00 PM. What time does it end?`,
          answer: '4:00 PM',
          choices: shuffle(['4:00 PM','3:60 PM','5:00 PM','3:30 PM']),
          explanation: `3:00 PM + 1 hour = 4:00 PM.`,
        };
      }
      const mins = totalE - totalS;
      const hrs = Math.floor(mins/60), remM = mins%60;
      const ans = hrs > 0 ? (remM > 0 ? `${hrs} hr ${remM} min` : `${hrs} hr`) : `${mins} min`;
      const d1 = hrs > 0 ? (remM > 0 ? `${hrs} hr ${remM+5} min` : `${hrs+1} hr`) : `${mins+5} min`;
      const d2 = hrs > 0 ? (remM > 0 ? `${hrs+1} hr ${remM} min` : `${hrs} hr ${15} min`) : `${mins-5} min`;
      const d3 = hrs > 0 && hrs > 1 ? `${hrs-1} hr ${remM} min` : `${mins+10} min`;
      const timePool = [d1, d2, d3].filter(x => x !== ans && !x.startsWith('-'));
      const timeChoices = [...new Set(timePool)];
      if (timeChoices.length < 3) timeChoices.push(`${mins + 20} min`);
      if (timeChoices.length < 3) timeChoices.push(`${mins + 30} min`);
      return {
        question: `From ${startH}:${String(startM).padStart(2,'0')} to ${endH}:${String(endM).padStart(2,'0')}, how long is that?`,
        answer: ans,
        choices: shuffle([ans, ...timeChoices.slice(0, 3)]),
        explanation: `Count from ${startH}:${String(startM).padStart(2,'0')} to ${endH}:${String(endM).padStart(2,'0')}: that is ${mins} minutes total, which is ${ans}.`,
      };
    },
    () => {
      const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
      const i = rand(0, 3); // 0..3 so i+3 ≤ 6 (valid index)
      const ans = days[i + 3];
      const opts = [days[i], days[i + 1], days[i + 2], ans, days[Math.min(i + 4, 6)]];
      const unique = [...new Set(opts)].filter(d => d !== ans).slice(0, 3);
      return {
        question: `What day comes 3 days after ${days[i]}?`,
        answer: ans,
        choices: shuffle([ans, ...unique]),
        explanation: `Count 3 days forward from ${days[i]}: ${days[i+1]} (1), ${days[i+2]} (2), ${days[i+3]} (3).`,
      };
    },
    () => {
      const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      const i = rand(0, 9); // 0..9 so i+1 ≤ 10 and no duplicate from Math.min(i+2,11)
      const ans = months[i + 1];
      const opts = [months[Math.max(i-1, 0)], months[i], months[i+2], months[Math.min(i+3, 11)]].filter(m => m && m !== ans);
      const unique = [...new Set(opts)].slice(0, 3);
      return {
        question: `What is the month after ${months[i]}?`,
        answer: ans,
        choices: shuffle([ans, ...unique]),
        explanation: `The months in order are: ...${months[i]}, ${ans}, ${months[i+2]}... The month after ${months[i]} is ${ans}.`,
      };
    },
  ])();
}

// ─── WORD PROBLEMS ────────────────────────────────────────────────────────────

function genWordProblems(): Question {
  return pick<() => Question>([
    () => {
      const a=rand(15,50), b=rand(5, a-5);
      return { question: `Sam has ${a} apples and gives away ${b}. How many are left?`, answer: String(a-b), choices: makeChoices(a-b, 8), explanation: `"Gives away" means subtract: ${a} − ${b} = ${a-b}.` };
    },
    () => {
      const p=rand(5,20), q=rand(3,10);
      return { question: `Each book costs $${p}. How much do ${q} books cost?`, answer: String(p*q), choices: makeChoices(p*q, 15), explanation: `Multiply the cost by the number of books: $${p} × ${q} = $${p*q}.` };
    },
    () => {
      const total=rand(60,200), kids=rand(2,10), share=Math.floor(total/kids);
      return { question: `${total} candies are shared equally among ${kids} children. How many does each get?`, answer: String(share), choices: makeChoices(share, 8), explanation: `"Shared equally" means divide: ${total} ÷ ${kids} = ${share}.` };
    },
    () => {
      const rows=rand(3,9), cols=rand(3,9);
      return { question: `A garden has ${rows} rows with ${cols} plants each. How many plants total?`, answer: String(rows*cols), choices: makeChoices(rows*cols, 10), explanation: `Multiply rows by plants per row: ${rows} × ${cols} = ${rows*cols}.` };
    },
    () => {
      const price=rand(10,50), paid=rand(price+1,100), change=paid-price;
      return { question: `An item costs $${price}. You pay $${paid}. How much change do you get?`, answer: String(change), choices: makeChoices(change, 8), explanation: `Change = amount paid − price: $${paid} − $${price} = $${change}.` };
    },
    () => {
      const speed=rand(2,6), time=rand(2,5);
      return { question: `A car travels ${speed} km every minute. How far does it travel in ${time} minutes?`, answer: String(speed*time), choices: makeChoices(speed*time, 5), explanation: `Distance = speed × time = ${speed} km/min × ${time} min = ${speed*time} km.` };
    },
    () => {
      const boxes=rand(3,8), per=rand(5,20), total=boxes*per, extra=rand(1,10);
      return { question: `A store has ${boxes} boxes with ${per} cans each, plus ${extra} loose cans. How many cans total?`, answer: String(total+extra), choices: makeChoices(total+extra, 15), explanation: `Cans in boxes: ${boxes} × ${per} = ${total}. Add loose cans: ${total} + ${extra} = ${total+extra}.` };
    },
    () => {
      const start=rand(100,500), sold=rand(20,100), bought=rand(10,80);
      return { question: `A shop had ${start} items. They sold ${sold} and received ${bought} new ones. How many now?`, answer: String(start-sold+bought), choices: makeChoices(start-sold+bought, 20), explanation: `Start with ${start}, subtract sold (−${sold}), add received (+${bought}): ${start} − ${sold} + ${bought} = ${start-sold+bought}.` };
    },
    () => {
      const t=rand(20,100), a=rand(5,t-5), b=t-a;
      return { question: `There are ${t} students. ${a} are in team A. How many are in team B?`, answer: String(b), choices: makeChoices(b, 8), explanation: `Subtract team A from total: ${t} − ${a} = ${b}.` };
    },
    () => {
      const len=rand(4,15), wid=rand(2,len);
      return { question: `A field is ${len} m long and ${wid} m wide. How many meters of fencing is needed to go all around?`, answer: String(2*(len+wid)), choices: makeChoices(2*(len+wid), 10), explanation: `Fencing = perimeter = 2 × (length + width) = 2 × (${len} + ${wid}) = ${2*(len+wid)} m.` };
    },
  ])();
}

// ─── DISPATCH ────────────────────────────────────────────────────────────────

export function generateQuestion(topic: Topic): Question {
  switch (topic) {
    case 'place-value':        return genPlaceValue();
    case 'addition':           return genAddition();
    case 'subtraction':        return genSubtraction();
    case 'multiplication':     return genMultiplication();
    case 'division':           return genDivision();
    case 'fractions':          return genFractionsMix();
    case 'fraction-simplify':  return genFractionSimplify();
    case 'fraction-compare':   return genFractionCompare();
    case 'fraction-add':       return genFractionAdd();
    case 'fraction-subtract':  return genFractionSubtract();
    case 'fraction-multiply':  return genFractionMultiply();
    case 'fraction-mixed':     return genFractionMixed();
    case 'decimals':           return genDecimals();
    case 'geometry':           return genGeometry();
    case 'measurement':        return genMeasurement();
    case 'patterns':           return genPatterns();
    case 'time':               return genTime();
    case 'word-problems':      return genWordProblems();
  }
}

// ─── TOPIC METADATA ──────────────────────────────────────────────────────────

export const TOPIC_CATEGORIES: Record<Category, { label: string; emoji: string }> = {
  numbers:              { label: 'Numbers & Operations', emoji: '🔢' },
  fractions:            { label: 'Fractions & Decimals', emoji: '🍕' },
  'measurement-geometry': { label: 'Geometry & Measurement', emoji: '📐' },
  'problem-solving':    { label: 'Problem Solving', emoji: '🧠' },
};

export const TOPICS: TopicMeta[] = [
  // Numbers
  { id: 'place-value',       label: 'Place Value',         emoji: '🔟', color: 'bg-sky-100 border-sky-400 text-sky-800',         category: 'numbers',               description: 'Round numbers, digit values, large numbers' },
  { id: 'addition',          label: 'Addition',            emoji: '➕', color: 'bg-blue-100 border-blue-400 text-blue-800',       category: 'numbers',               description: 'Multi-digit addition, 3 addends' },
  { id: 'subtraction',       label: 'Subtraction',         emoji: '➖', color: 'bg-red-100 border-red-400 text-red-800',          category: 'numbers',               description: 'Multi-digit subtraction with regrouping' },
  { id: 'multiplication',    label: 'Multiplication',      emoji: '✖️', color: 'bg-green-100 border-green-400 text-green-800',    category: 'numbers',               description: 'Times tables, 2-digit multiplication' },
  { id: 'division',          label: 'Division',            emoji: '➗', color: 'bg-yellow-100 border-yellow-400 text-yellow-800', category: 'numbers',               description: 'Division with and without remainders' },
  // Fractions
  { id: 'fractions',         label: 'Fractions Mix',       emoji: '🔢', color: 'bg-purple-100 border-purple-400 text-purple-800', category: 'fractions',             description: 'Mixed fraction problems' },
  { id: 'fraction-simplify', label: 'Simplify Fractions',  emoji: '✂️', color: 'bg-violet-100 border-violet-400 text-violet-800', category: 'fractions',             description: 'Reduce fractions to lowest terms' },
  { id: 'fraction-compare',  label: 'Compare Fractions',   emoji: '⚖️', color: 'bg-indigo-100 border-indigo-400 text-indigo-800', category: 'fractions',             description: 'Greater than, less than, or equal' },
  { id: 'fraction-add',      label: 'Add Fractions',       emoji: '➕', color: 'bg-fuchsia-100 border-fuchsia-400 text-fuchsia-800', category: 'fractions',           description: 'Same & different denominators' },
  { id: 'fraction-subtract', label: 'Subtract Fractions',  emoji: '➖', color: 'bg-pink-100 border-pink-400 text-pink-800',       category: 'fractions',             description: 'Same & different denominators' },
  { id: 'fraction-multiply', label: 'Multiply Fractions',  emoji: '✖️', color: 'bg-rose-100 border-rose-400 text-rose-800',       category: 'fractions',             description: 'Fraction × fraction, fraction × whole' },
  { id: 'fraction-mixed',    label: 'Mixed Numbers',       emoji: '🔄', color: 'bg-purple-100 border-purple-500 text-purple-900', category: 'fractions',             description: 'Convert & add mixed numbers' },
  { id: 'decimals',          label: 'Decimals',            emoji: '🔡', color: 'bg-teal-100 border-teal-400 text-teal-800',       category: 'fractions',             description: 'Add, subtract, compare, round decimals' },
  // Geometry & Measurement
  { id: 'geometry',          label: 'Geometry',            emoji: '📐', color: 'bg-lime-100 border-lime-400 text-lime-800',       category: 'measurement-geometry',  description: 'Area, perimeter, angles, shapes' },
  { id: 'measurement',       label: 'Measurement',         emoji: '📏', color: 'bg-emerald-100 border-emerald-400 text-emerald-800', category: 'measurement-geometry', description: 'Convert units: cm, m, km, kg, L' },
  { id: 'patterns',          label: 'Patterns',            emoji: '🔣', color: 'bg-amber-100 border-amber-400 text-amber-800',    category: 'problem-solving',       description: 'Number sequences, missing numbers, rules' },
  { id: 'time',              label: 'Time',                emoji: '⏰', color: 'bg-orange-100 border-orange-400 text-orange-800', category: 'problem-solving',       description: 'Elapsed time, schedules, calendars' },
  // Word Problems
  { id: 'word-problems',     label: 'Word Problems',       emoji: '📖', color: 'bg-orange-100 border-orange-500 text-orange-900', category: 'problem-solving',       description: 'Real-world multi-step problems' },
];
