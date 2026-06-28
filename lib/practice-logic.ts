export const TARGET_POINTS = 100;
export const POINTS_CORRECT = 2;
export const POINTS_WRONG = 2;

export function calcScore(current: number, correct: boolean): number {
  return Math.max(0, current + (correct ? POINTS_CORRECT : -POINTS_WRONG));
}

export function isSessionComplete(points: number): boolean {
  return points >= TARGET_POINTS;
}

export function calcAccuracy(correct: number, total: number): number {
  return total === 0 ? 0 : Math.round((correct / total) * 100);
}
