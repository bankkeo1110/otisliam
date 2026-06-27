import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { studentBadges } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

const BADGE_RANK: Record<string, number> = { bronze: 1, silver: 2, gold: 3, perfect: 4 };

// Badge based on accuracy (correct / total answered * 100)
function calcBadge(accuracy: number): string {
  if (accuracy === 100) return 'perfect';
  if (accuracy >= 85) return 'gold';
  if (accuracy >= 70) return 'silver';
  return 'bronze';
}

export async function POST(req: NextRequest) {
  const { studentId, topic, correct, total } = await req.json();
  if (!studentId || !topic || correct == null || !total) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const accuracy = Math.round((correct / total) * 100);
  const newBadge = calcBadge(accuracy);

  const existing = await db.select().from(studentBadges).where(
    and(eq(studentBadges.studentId, studentId), eq(studentBadges.topic, topic))
  ).limit(1);

  if (!existing.length) {
    await db.insert(studentBadges).values({ studentId, topic, badge: newBadge, bestScore: accuracy, attempts: 1 });
    return NextResponse.json({ badge: newBadge, isNew: true, isUpgrade: false, previousBadge: null });
  }

  const prev = existing[0];
  const isUpgrade = BADGE_RANK[newBadge] > BADGE_RANK[prev.badge];
  const finalBadge = isUpgrade ? newBadge : prev.badge;
  const finalScore = accuracy > prev.bestScore ? accuracy : prev.bestScore;

  await db.update(studentBadges).set({
    badge: finalBadge,
    bestScore: finalScore,
    attempts: prev.attempts + 1,
    updatedAt: new Date(),
  }).where(eq(studentBadges.id, prev.id));

  return NextResponse.json({ badge: finalBadge, isNew: false, isUpgrade, previousBadge: prev.badge });
}
