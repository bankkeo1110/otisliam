import { NextRequest, NextResponse } from 'next/server';
import { db, ready } from '@/lib/db';
import { students, studentBadges, answers } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ready;
  const { id } = await params;
  const studentId = parseInt(id);
  if (isNaN(studentId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const [student] = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
  if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const badges = await db.select().from(studentBadges).where(eq(studentBadges.studentId, studentId));

  const recentAnswers = await db.select().from(answers)
    .where(eq(answers.studentId, studentId))
    .orderBy(desc(answers.answeredAt))
    .limit(30);

  return NextResponse.json({ student, badges, recentAnswers });
}
