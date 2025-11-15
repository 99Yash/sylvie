import { db, desc, eq, notes } from '@sylvie/db';
import z from 'zod';
import { protectedProcedure, router } from '..';

export const noteRouter = router({
  create: protectedProcedure
    .input(z.object({ title: z.string(), content: z.string() }))
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
    .query(async ({ input }) => {
      const [note] = await db
        .select()
        .from(notes)
        .where(eq(notes.id, input.id))
        .limit(1);
      return note;
    }),
});
