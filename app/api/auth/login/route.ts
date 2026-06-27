import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { students } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { signToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { name, password } = await req.json();

  const [student] = await db.select()
    .from(students).where(eq(students.name, name?.trim() ?? '')).limit(1);

  if (!student || !student.passwordHash) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  }

  const valid = await bcrypt.compare(password ?? '', student.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  }

  const token = await signToken({ studentId: student.id, name: student.name });
  const res = NextResponse.json({ success: true, name: student.name, studentId: student.id });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true, maxAge: 60 * 60 * 24 * 30, path: '/', sameSite: 'lax',
  });
  return res;
}
