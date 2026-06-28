import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import * as schema from './schema';

const client = neon(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });

// Idempotent auto-migration — safely adds new columns on cold start
export const ready: Promise<void> = db
  .execute(sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS avatar varchar(10)`)
  .then(() => undefined)
  .catch(() => undefined);
