import { index, pgTable, text, varchar } from 'drizzle-orm/pg-core';
import { createId, lifecycle_dates } from '../helpers';
import { user } from './auth';

export const notes = pgTable(
  'notes',
  {
    id: varchar('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    title: text('title').notNull(),
    content: text('content').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    ...lifecycle_dates,
  },
  (table) => [index('idx_notes_user_id').on(table.userId)]
);

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
