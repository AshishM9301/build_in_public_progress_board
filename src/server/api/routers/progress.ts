import { z } from "zod";
import { createTRPCRouter, privateProcedure } from "@/server/api/trpc";

// Input validation schemas
const createDailyPostSchema = z.object({
    projectId: z.string().min(1, "Project ID is required"),
    content: z.string().min(1, "Progress content is required"),
});

const getProgressHistorySchema = z.object({
    projectId: z.string().min(1, "Project ID is required"),
    limit: z.number().int().min(1).max(100).optional().default(50),
    offset: z.number().int().min(0).optional().default(0),
});

export const progressRouter = createTRPCRouter({
    // Create a daily progress post
    createDailyPost: privateProcedure
        .input(createDailyPostSchema)
        .mutation(async ({ ctx, input }) => {
            const { projectId, content } = input;
            const userId = ctx.user.id;

            // Get the project and verify ownership
            const project = await ctx.db.project.findFirst({
                where: { id: projectId, userId, isActive: true },
                include: {
                    streakChallenges: {
                        where: { isCompleted: false },
                        orderBy: { dayNumber: "asc" },
                        take: 1,
                    },
                },
            });

            if (!project) {
                throw new Error("Project not found or inactive");
            }

            if (project.streakChallenges.length === 0) {
                throw new Error("No more streak days available for this project");
            }

            const currentStreakDay = project.streakChallenges[0];

            // Create the daily progress post
            const dailyProgress = await ctx.db.dailyProgress.create({
                data: {
                    projectId,
                    streakDayId: currentStreakDay.id,
                    userId,
                    content,
                },
                include: {
                    streakDay: true,
                },
            });

            // Mark the streak day as posted and completed
            await ctx.db.streakChallenge.update({
                where: { id: currentStreakDay.id },
                data: {
                    isPosted: true,
                    isCompleted: true,
                },
            });

            // Update streak statistics
            const stats = await ctx.db.userStreakStats.findFirst({
                where: { userId, projectId },
            });

            if (stats) {
                const newCurrentStreak = stats.currentStreak + 1;
                const newLongestStreak = Math.max(stats.longestStreak, newCurrentStreak);
                const newTotalPosts = stats.totalPosts + 1;

                await ctx.db.userStreakStats.update({
                    where: { id: stats.id },
                    data: {
                        currentStreak: newCurrentStreak,
                        longestStreak: newLongestStreak,
                        totalPosts: newTotalPosts,
                        lastPostedDate: new Date(),
                    },
                });

                // Check if challenge is completed
                if (newCurrentStreak >= project.targetStreakDays) {
                    await ctx.db.userStreakStats.update({
                        where: { id: stats.id },
                        data: {
                            challengesCompleted: stats.challengesCompleted + 1,
                        },
                    });
                }
            }

            return {
                success: true,
                progress: dailyProgress,
                message: `Day ${currentStreakDay.dayNumber} progress posted successfully!`,
                streakDay: currentStreakDay.dayNumber,
                totalStreakDays: project.targetStreakDays,
            };
        }),

    // Get progress history for a project
    getProgressHistory: privateProcedure
        .input(getProgressHistorySchema)
        .query(async ({ ctx, input }) => {
            const { projectId, limit, offset } = input;
            const userId = ctx.user.id;

            // Verify project ownership
            const project = await ctx.db.project.findFirst({
                where: { id: projectId, userId, isActive: true },
            });

            if (!project) {
                throw new Error("Project not found or inactive");
            }

            const progress = await ctx.db.dailyProgress.findMany({
                where: { projectId, userId },
                include: {
                    streakDay: true,
                },
                orderBy: { createdAt: "desc" },
                take: limit,
                skip: offset,
            });

            const total = await ctx.db.dailyProgress.count({
                where: { projectId, userId },
            });

            return {
                success: true,
                progress,
                total,
                hasMore: offset + limit < total,
            };
        }),

    // Get today's status for a project
    getTodayStatus: privateProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
            const { projectId } = input;
            const userId = ctx.user.id;

            // Get today's date (start of day)
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Check if there's a post for today
            const todayPost = await ctx.db.dailyProgress.findFirst({
                where: {
                    projectId,
                    userId,
                    createdAt: {
                        gte: today,
                        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
                    },
                },
                include: {
                    streakDay: true,
                },
            });

            // Get current streak status
            const stats = await ctx.db.userStreakStats.findFirst({
                where: { userId, projectId },
            });

            // Get next available streak day
            const nextStreakDay = await ctx.db.streakChallenge.findFirst({
                where: {
                    projectId,
                    userId,
                    isCompleted: false,
                },
                orderBy: { dayNumber: "asc" },
            });

            return {
                success: true,
                hasPostedToday: !!todayPost,
                todayPost,
                currentStreak: stats?.currentStreak || 0,
                nextStreakDay: nextStreakDay?.dayNumber || null,
                totalStreakDays: stats ? stats.totalPosts : 0,
            };
        }),

    // Get streak calendar for a project
    getStreakCalendar: privateProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
            const { projectId } = input;
            const userId = ctx.user.id;

            // Verify project ownership
            const project = await ctx.db.project.findFirst({
                where: { id: projectId, userId, isActive: true },
            });

            if (!project) {
                throw new Error("Project not found or inactive");
            }

            // Get all streak days with their status
            const streakDays = await ctx.db.streakChallenge.findMany({
                where: { projectId, userId },
                include: {
                    dailyProgress: true,
                },
                orderBy: { dayNumber: "asc" },
            });

            // Format calendar data
            const calendar = streakDays.map(day => ({
                dayNumber: day.dayNumber,
                targetDate: day.targetDate,
                isPosted: day.isPosted,
                isCompleted: day.isCompleted,
                hasProgress: day.dailyProgress.length > 0,
                progress: day.dailyProgress[0] || null,
            }));

            return {
                success: true,
                calendar,
                totalDays: project.targetStreakDays,
                completedDays: calendar.filter(day => day.isCompleted).length,
                progressPercentage: Math.round((calendar.filter(day => day.isCompleted).length / project.targetStreakDays) * 100),
            };
        }),

    // Check if user can post today (for streak validation)
    canPostToday: privateProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
            const { projectId } = input;
            const userId = ctx.user.id;

            // Get today's date
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Check if there's already a post for today
            const todayPost = await ctx.db.dailyProgress.findFirst({
                where: {
                    projectId,
                    userId,
                    createdAt: {
                        gte: today,
                        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
                    },
                },
            });

            if (todayPost) {
                return {
                    success: false,
                    canPost: false,
                    reason: "Already posted today",
                    todayPost,
                };
            }

            // Check if there's a streak day available
            const availableStreakDay = await ctx.db.streakChallenge.findFirst({
                where: {
                    projectId,
                    userId,
                    isCompleted: false,
                },
                orderBy: { dayNumber: "asc" },
            });

            if (!availableStreakDay) {
                return {
                    success: false,
                    canPost: false,
                    reason: "No more streak days available",
                };
            }

            return {
                success: true,
                canPost: true,
                nextStreakDay: availableStreakDay.dayNumber,
                targetDate: availableStreakDay.targetDate,
            };
        }),
});
