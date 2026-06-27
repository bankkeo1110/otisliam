import { describe, it, expect } from 'vitest';
import { generateQuestion, TOPICS, type Topic } from '../lib/questions';

const ALL_TOPICS: Topic[] = TOPICS.map(t => t.id);

// Run each topic 5 times to catch randomness issues without being slow
const RUNS = 5;

describe('generateQuestion – structure', () => {
  for (const topic of ALL_TOPICS) {
    describe(`topic: ${topic}`, () => {
      for (let i = 0; i < RUNS; i++) {
        it(`run #${i + 1}: has valid question, answer, and 4 choices`, () => {
          const q = generateQuestion(topic);

          expect(typeof q.question).toBe('string');
          expect(q.question.length).toBeGreaterThan(0);

          expect(typeof q.answer).toBe('string');
          expect(q.answer.length).toBeGreaterThan(0);

          expect(Array.isArray(q.choices)).toBe(true);
          expect(q.choices).toHaveLength(4);
        });

        it(`run #${i + 1}: answer is always in choices`, () => {
          const q = generateQuestion(topic);
          expect(q.choices).toContain(q.answer);
        });

        it(`run #${i + 1}: no choice is undefined or empty`, () => {
          const q = generateQuestion(topic);
          for (const c of q.choices) {
            expect(c).toBeDefined();
            expect(c.length).toBeGreaterThan(0);
            expect(c).not.toBe('NaN');
            expect(c).not.toMatch(/undefined/i);
          }
        });

        it(`run #${i + 1}: all 4 choices are unique`, () => {
          const q = generateQuestion(topic);
          const unique = new Set(q.choices);
          expect(unique.size).toBe(4);
        });
      }
    });
  }
});

describe('TOPICS metadata', () => {
  it('has 18 topics', () => {
    expect(TOPICS).toHaveLength(18);
  });

  it('every topic has required fields', () => {
    for (const t of TOPICS) {
      expect(typeof t.id).toBe('string');
      expect(typeof t.label).toBe('string');
      expect(typeof t.emoji).toBe('string');
      expect(typeof t.color).toBe('string');
      expect(['numbers', 'fractions', 'measurement-geometry', 'problem-solving']).toContain(t.category);
    }
  });

  it('topic ids are all unique', () => {
    const ids = TOPICS.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
