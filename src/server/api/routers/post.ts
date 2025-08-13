import { z } from "zod";

import { createTRPCRouter, publicProcedure, privateProcedure } from "@/server/api/trpc";

export const postRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  create: privateProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      // Now we have access to ctx.user and ctx.session
      return ctx.db.post.create({
        data: {
          name: input.name,
          // You can add user-specific data here
          // userId: ctx.user.id, // if you have user ID in your schema
        },
      });
    }),

  getLatest: publicProcedure.query(async ({ ctx }) => {
    const post = await ctx.db.post.findFirst({
      orderBy: { createdAt: "desc" },
    });

    return post ?? null;
  }),

  // New private procedure that shows user data access
  getUserPosts: privateProcedure.query(async ({ ctx }) => {
    // This procedure is protected and only accessible to authenticated users
    // ctx.user contains the authenticated user data
    // ctx.session contains the full session data

    const posts = await ctx.db.post.findMany({
      // You can filter by user if you have userId in your schema
      // where: { userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
    });

    return {
      posts,
      user: ctx.user,
      message: `Found ${posts.length} posts for user ${ctx.user.email}`,
    };
  }),
});
