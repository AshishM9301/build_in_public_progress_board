import { postRouter } from "@/server/api/routers/post";
import { projectRouter } from "@/server/api/routers/project";
import { categoryRouter } from "@/server/api/routers/category";
import { progressRouter } from "@/server/api/routers/progress";
import { badgeRouter } from "@/server/api/routers/badge";
import { notificationRouter } from "@/server/api/routers/notification";
import { streakRouter } from "@/server/api/routers/streak";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  project: projectRouter,
  category: categoryRouter,
  progress: progressRouter,
  badge: badgeRouter,
  notification: notificationRouter,
  streak: streakRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
