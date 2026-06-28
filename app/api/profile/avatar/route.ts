import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { db, ready } from '@/lib/db';
import { students } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const VALID_AVATARS = new Set([
  '🦁','🐯','🐻','🐼','🦊','🐺',
  '🦄','🐲','🦈','🐙','🦋','🐸',
  '🦅','🦉','🦜','🐬','🐒','🐘',
  '🦒','🦓','🦝','🦩','🦚','👾',
]);

export async function PATCH(req: NextRequest) {
  await ready;
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { avatar } = await req.json();
  if (!VALID_AVATARS.has(avatar)) return NextResponse.json({ error: 'Invalid avatar' }, { status: 400 });

  await db.update(students).set({ avatar }).where(eq(students.id, user.studentId));
  return NextResponse.json({ success: true, avatar });
}
