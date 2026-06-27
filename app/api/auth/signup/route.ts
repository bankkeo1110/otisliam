import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { students } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { signToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { name, password } = await req.json();

  if (!name?.trim() || name.trim().length < 2) {
    return NextResponse.json({ error: 'Username must be at least 2 characters' }, { status: 400 });
  }
  if (!password || password.length < 4) {
    return NextResponse.json({ error: 'Password must be at least 4 characters' }, { status: 400 });
  }

  const existing = await db.select({ id: students.id })
    .from(students).where(eq(students.name, name.trim())).limit(1);
  if (existing.length) {
    return NextResponse.json({ error: 'Username already taken — choose another' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [student] = await db.insert(students)
    .values({ name: name.trim(), passwordHash })
    .returning();

  const token = await signToken({ studentId: student.id, name: student.name });
  const res = NextResponse.json({ success: true, name: student.name, studentId: student.id });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true, maxAge: 60 * 60 * 24 * 30, path: '/', sameSite: 'lax',
  });
  return res;
}
