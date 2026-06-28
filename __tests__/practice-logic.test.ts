import { describe, it, expect } from 'vitest';
import {
  TARGET_POINTS,
  POINTS_CORRECT,
  POINTS_WRONG,
  calcScore,
  isSessionComplete,
  calcAccuracy,
} from '../lib/practice-logic';

describe('practice-logic – constants', () => {
  it('TARGET_POINTS is 100', () => expect(TARGET_POINTS).toBe(100));
  it('POINTS_CORRECT is positive', () => expect(POINTS_CORRECT).toBeGreaterThan(0));
  it('POINTS_WRONG is positive', () => expect(POINTS_WRONG).toBeGreaterThan(0));
});

describe('calcScore', () => {
  it('adds POINTS_CORRECT on a correct answer', () => {
    expect(calcScore(0, true)).toBe(POINTS_CORRECT);
    expect(calcScore(50, true)).toBe(50 + POINTS_CORRECT);
  });

  it('subtracts POINTS_WRONG on a wrong answer', () => {
    expect(calcScore(10, false)).toBe(10 - POINTS_WRONG);
  });

  it('never goes below 0', () => {
    expect(calcScore(0, false)).toBe(0);
    expect(calcScore(1, false)).toBe(0);
  });

  it('reaches TARGET_POINTS after enough correct answers from 0', () => {
    let pts = 0;
    const needed = Math.ceil(TARGET_POINTS / POINTS_CORRECT);
    for (let i = 0; i < needed; i++) pts = calcScore(pts, true);
    expect(pts).toBeGreaterThanOrEqual(TARGET_POINTS);
  });
});

describe('isSessionComplete', () => {
  it('returns false below target', () => {
    expect(isSessionComplete(0)).toBe(false);
    expect(isSessionComplete(TARGET_POINTS - 1)).toBe(false);
  });

  it('returns true at target', () => {
    expect(isSessionComplete(TARGET_POINTS)).toBe(true);
  });

  it('returns true above target', () => {
    expect(isSessionComplete(TARGET_POINTS + 10)).toBe(true);
  });
});

describe('calcAccuracy', () => {
  it('returns 0 when no questions answered', () => {
    expect(calcAccuracy(0, 0)).toBe(0);
  });

  it('returns 100 when all correct', () => {
    expect(calcAccuracy(10, 10)).toBe(100);
  });

  it('returns 0 when all wrong', () => {
    expect(calcAccuracy(0, 10)).toBe(0);
  });

  it('rounds to nearest integer', () => {
    expect(calcAccuracy(1, 3)).toBe(33); // 33.33...
    expect(calcAccuracy(2, 3)).toBe(67); // 66.66...
  });

  it('handles 50% correctly', () => {
    expect(calcAccuracy(5, 10)).toBe(50);
  });
});

describe('Got It flow – session completion gate', () => {
  it('session is NOT complete after zero correct answers', () => {
    expect(isSessionComplete(calcScore(0, false))).toBe(false);
  });

  it('session IS complete once points reach target', () => {
    let pts = 0;
    while (!isSessionComplete(pts)) pts = calcScore(pts, true);
    expect(isSessionComplete(pts)).toBe(true);
  });

  it('wrong answer after near-complete does not complete session', () => {
    const nearComplete = TARGET_POINTS - POINTS_WRONG - 1;
    expect(isSessionComplete(calcScore(nearComplete, false))).toBe(false);
  });

  it('correct answer at exactly one step away completes session', () => {
    const oneAway = TARGET_POINTS - POINTS_CORRECT;
    expect(isSessionComplete(calcScore(oneAway, true))).toBe(true);
  });
});
