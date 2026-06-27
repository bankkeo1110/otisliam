import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { answers, students } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId');

  const allStudents = await db.select().from(students);

  let rows;
  if (studentId) {
    rows = await db.select().from(answers)
      .where(eq(answers.studentId, parseInt(studentId)))
      .orderBy(desc(answers.answeredAt));
  } else {
    rows = await db.select().from(answers).orderBy(desc(answers.answeredAt));
  }

  const header = ['Student', 'Topic', 'Question', 'Correct Answer', 'Student Answer', 'Result', 'Date'];
  const csvRows = rows.map(r => {
    const student = allStudents.find(s => s.id === r.studentId);
    const date = r.answeredAt ? new Date(r.answeredAt).toLocaleString() : '';
    return [
      student?.name ?? '',
      r.topic,
      `"${r.question.replace(/"/g, '""')}"`,
      r.correctAnswer,
      r.studentAnswer,
      r.isCorrect ? 'Correct' : 'Wrong',
      date,
    ].join(',');
  });

  const csv = [header.join(','), ...csvRows].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="math-report.csv"',
    },
  });
}
