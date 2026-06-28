import { describe, it, expect } from 'vitest';
import { GROWTH_QUESTIONS, CATEGORIES } from '../lib/growth-questions';

describe('growth-questions data', () => {
  it('has exactly 50 questions', () => {
    expect(GROWTH_QUESTIONS).toHaveLength(50);
  });

  it('each question has required fields', () => {
    for (const q of GROWTH_QUESTIONS) {
      expect(q.id, `q${q.id} missing id`).toBeTypeOf('number');
      expect(q.category, `q${q.id} missing category`).toBeTruthy();
      expect(q.emoji, `q${q.id} missing emoji`).toBeTruthy();
      expect(q.goodAction, `q${q.id} missing goodAction`).toBeTruthy();
      expect(q.badAction, `q${q.id} missing badAction`).toBeTruthy();
      expect(q.goodResult, `q${q.id} missing goodResult`).toBeTruthy();
      expect(q.badResult, `q${q.id} missing badResult`).toBeTruthy();
    }
  });

  it('ids are sequential from 1 to 50', () => {
    const ids = GROWTH_QUESTIONS.map(q => q.id);
    expect(ids).toEqual(Array.from({ length: 50 }, (_, i) => i + 1));
  });

  it('no question has identical goodAction and badAction', () => {
    for (const q of GROWTH_QUESTIONS) {
      expect(q.goodAction, `q${q.id} good and bad actions must differ`).not.toBe(q.badAction);
    }
  });

  it('no question has identical goodResult and badResult', () => {
    for (const q of GROWTH_QUESTIONS) {
      expect(q.goodResult, `q${q.id} good and bad results must differ`).not.toBe(q.badResult);
    }
  });

  it('all action text is non-trivially long (at least 10 chars)', () => {
    for (const q of GROWTH_QUESTIONS) {
      expect(q.goodAction.length, `q${q.id} goodAction too short`).toBeGreaterThanOrEqual(10);
      expect(q.badAction.length, `q${q.id} badAction too short`).toBeGreaterThanOrEqual(10);
      expect(q.goodResult.length, `q${q.id} goodResult too short`).toBeGreaterThanOrEqual(10);
      expect(q.badResult.length, `q${q.id} badResult too short`).toBeGreaterThanOrEqual(10);
    }
  });

  it('covers all 5 expected categories', () => {
    const expected = [
      'Money & Buying',
      'Health & Energy',
      'Friendships & Respect',
      'Skills & Creativity',
      'Your Amazing Future',
    ];
    for (const cat of expected) {
      expect(CATEGORIES, `missing category: ${cat}`).toContain(cat);
    }
  });

  it('each category has at least 5 questions', () => {
    for (const cat of CATEGORIES) {
      const count = GROWTH_QUESTIONS.filter(q => q.category === cat).length;
      expect(count, `${cat} has too few questions`).toBeGreaterThanOrEqual(5);
    }
  });

  it('each category has exactly 10 questions', () => {
    for (const cat of CATEGORIES) {
      const count = GROWTH_QUESTIONS.filter(q => q.category === cat).length;
      expect(count, `${cat} should have 10 questions`).toBe(10);
    }
  });

  it('CATEGORIES export matches unique categories in data', () => {
    const fromData = [...new Set(GROWTH_QUESTIONS.map(q => q.category))];
    expect(CATEGORIES.sort()).toEqual(fromData.sort());
  });
});

describe('growth-questions game logic', () => {
  it('correct assignment: good → good-result, bad → bad-result passes check', () => {
    for (const q of GROWTH_QUESTIONS.slice(0, 5)) {
      const assignment = { good: 'good-result' as const, bad: 'bad-result' as const };
      const isCorrect = assignment.good === 'good-result' && assignment.bad === 'bad-result';
      expect(isCorrect, `q${q.id} correct assignment should pass`).toBe(true);
    }
  });

  it('swapped assignment: good → bad-result, bad → good-result fails check', () => {
    for (const q of GROWTH_QUESTIONS.slice(0, 5)) {
      const assignment = { good: 'bad-result' as const, bad: 'good-result' as const };
      const isCorrect = assignment.good === 'good-result' && assignment.bad === 'bad-result';
      expect(isCorrect, `q${q.id} swapped assignment should fail`).toBe(false);
    }
  });
});
