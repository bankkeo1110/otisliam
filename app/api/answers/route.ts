import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { answers } from '@/lib/db/schema';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { studentId, topic, question, correctAnswer, studentAnswer, isCorrect } = body;
  const [row] = await db.insert(answers).values({
    studentId,
    topic,
    question,
    correctAnswer,
    studentAnswer,
    isCorrect,
  }).returning();
  return NextResponse.json(row);
}
