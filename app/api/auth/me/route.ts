import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { students } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ user: null });
  const [row] = await db.select({ avatar: students.avatar }).from(students).where(eq(students.id, user.studentId)).limit(1);
  return NextResponse.json({ user: { ...user, avatar: row?.avatar ?? null } });
}
