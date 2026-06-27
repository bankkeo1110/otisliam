import { pgTable, serial, text, integer, boolean, timestamp, varchar } from 'drizzle-orm/pg-core';

export const students = pgTable('students', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').references(() => students.id),
  topic: varchar('topic', { length: 50 }).notNull(),
  startedAt: timestamp('started_at').defaultNow(),
  finishedAt: timestamp('finished_at'),
});

export const answers = pgTable('answers', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').references(() => sessions.id),
  studentId: integer('student_id').references(() => students.id),
  topic: varchar('topic', { length: 50 }).notNull(),
  question: text('question').notNull(),
  correctAnswer: text('correct_answer').notNull(),
  studentAnswer: text('student_answer').notNull(),
  isCorrect: boolean('is_correct').notNull(),
  answeredAt: timestamp('answered_at').defaultNow(),
});
