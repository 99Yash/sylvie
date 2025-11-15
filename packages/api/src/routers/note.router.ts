import { and, db, desc, eq, notes } from '@sylvie/db';
import z from 'zod';
import { protectedProcedure, router } from '..';

export const noteRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        title: z
          .string()
          .min(1, 'Title cannot be empty')
          .max(500, 'Title must be 500 characters or less'),
        content: z
          .string()
          .min(1, 'Content cannot be empty')
          .max(50000, 'Content must be 50,000 characters or less'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [note] = await db
        .insert(notes)
        .values({
          title: input.title,
          content: input.content,
          userId: ctx.session.user.id,
        })
        .returning();
      return note;
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const notesList = await db
      .select()
      .from(notes)
      .where(eq(notes.userId, ctx.session.user.id))
      .orderBy(desc(notes.createdAt));
    return notesList;
  }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [note] = await db
        .select()
        .from(notes)
        .where(and(eq(notes.id, input.id), eq(notes.userId, ctx.session.user.id)))
        .limit(1);
      return note;
    }),
});
