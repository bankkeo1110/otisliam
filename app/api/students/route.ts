import { NextRequest, NextResponse } from 'next/server';
import { db, ready } from '@/lib/db';
import { students } from '@/lib/db/schema';

export async function GET() {
  await ready;
  const all = await db.select().from(students).orderBy(students.name);
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });
  const [student] = await db.insert(students).values({ name: name.trim() }).returning();
  return NextResponse.json(student);
}
