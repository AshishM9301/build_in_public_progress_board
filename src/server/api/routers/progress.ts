import { z } from "zod";
import { createTRPCRouter, privateProcedure } from "@/server/api/trpc";

// Input validation schemas
const createDailyPostSchema = z.object({
    projectId: z.string().min(1, "Project ID is required"),
    content: z.string().min(1, "Progress content is required"),
    imageData: z.object({
        url: z.string().url("Valid image URL is required"),
        filename: z.string(),
        size: z.number(),
        mimeType: z.string(),
        width: z.number().optional(),
        height: z.number().optional(),
    }).optional(),
});

const updateDailyPostSchema = z.object({
    id: z.string().min(1, "Progress ID is required"),
    content: z.string().min(1, "Progress content is required"),
    imageData: z.object({
        url: z.string().url("Valid image URL is required"),
        filename: z.string(),
        size: z.number(),
        mimeType: z.string(),
        width: z.number().optional(),
        height: z.number().optional(),
    }).optional(),
});

const getProgressHistorySchema = z.object({
    projectId: z.string().min(1, "Project ID is required"),
    limit: z.number().int().min(1).max(100).optional().default(50),
    offset: z.number().int().min(0).optional().default(0),
});

const getProgressByDateSchema = z.object({
    projectId: z.string().min(1, "Project ID is required"),
    targetDate: z.date(),
});

export const progressRouter = createTRPCRouter({
    // Create a daily progress post using date-based logic
    createDailyPost: privateProcedure
        .input(createDailyPostSchema)
        .mutation(async ({ ctx, input }) => {
            const { projectId, content, imageData } = input;
            const userId = ctx.user.id;

            // Get the project and verify ownership
            const project = await ctx.db.project.findFirst({
                where: { id: projectId, userId, isActive: true },
            });

            if (!project) {
                throw new Error("Project not found or inactive");
            }



            // Get today's date (start of day)
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Count how many posts exist for today
            const todayPostsCount = await ctx.db.dailyProgress.count({
                where: {
                    projectId,
                    userId,
                    createdAt: {
                        gte: today,
                        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
                    },
                },
            });

            // Check if user has reached the daily post limit
            const maxPostsPerDay = process.env.MAX_POSTS_PER_DAY ? parseInt(process.env.MAX_POSTS_PER_DAY) : 5;

            if (todayPostsCount >= maxPostsPerDay) {
                throw new Error(`You have already posted ${todayPostsCount} times today. Maximum allowed: ${maxPostsPerDay} posts per day.`);
            }
            // If we reach here, user is under the daily limit and can post

            // Calculate current day number (days since project start)
            const startDate = new Date(project.startedAt!);
            startDate.setHours(0, 0, 0, 0);
            const currentDayNumber = Math.floor((today.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;

            // Create the daily progress post (no need for streakDayId anymore)
            const dailyProgress = await ctx.db.dailyProgress.create({
                data: {
                    projectId,
                    userId,
                    content,
                    // Add image metadata if provided
                    ...(imageData && {
                        imageUrl: imageData.url,
                        imageFilename: imageData.filename,
                        imageSize: imageData.size,
                        imageMimeType: imageData.mimeType,
                        imageWidth: imageData.width,
                        imageHeight: imageData.height,
                        imageUploadedAt: new Date(),
                    }),
                },
            });



            // Update or create streak statistics
            const stats = await ctx.db.userStreakStats.findFirst({
                where: { userId, projectId },
            });

            if (stats) {
                // Update existing stats
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
            } else {
                // Create new stats
                await ctx.db.userStreakStats.create({
                    data: {
                        userId,
                        projectId,
                        currentStreak: 1,
                        longestStreak: 1,
                        totalPosts: 1,
                        lastPostedDate: new Date(),
                        challengesCompleted: 0,
                    },
                });
            }

            return {
                success: true,
                progress: dailyProgress,
                message: `Day ${currentDayNumber} progress posted successfully!`,
                currentDay: currentDayNumber,
                totalStreakDays: project.targetStreakDays,
            };
        }),

    // Update a daily progress post
    updateDailyPost: privateProcedure
        .input(updateDailyPostSchema)
        .mutation(async ({ ctx, input }) => {
            const { id, content, imageData } = input;
            const userId = ctx.user.id;

            // Find the daily progress post
            const dailyProgress = await ctx.db.dailyProgress.findFirst({
                where: { id, userId },
            });

            if (!dailyProgress) {
                throw new Error("Progress post not found or unauthorized");
            }

            // Update the content and image data if provided
            const updatedDailyProgress = await ctx.db.dailyProgress.update({
                where: { id },
                data: {
                    content,
                    ...(imageData && {
                        imageUrl: imageData.url,
                        imageFilename: imageData.filename,
                        imageSize: imageData.size,
                        imageMimeType: imageData.mimeType,
                        imageWidth: imageData.width,
                        imageHeight: imageData.height,
                    }),
                },
            });

            return {
                success: true,
                progress: updatedDailyProgress,
                message: "Progress post updated successfully!",
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

    // Get progress by date for a project
    getProgressByDate: privateProcedure
        .input(getProgressByDateSchema)
        .query(async ({ ctx, input }) => {
            const { projectId, targetDate } = input;
            const userId = ctx.user.id;

            // Verify project ownership
            const project = await ctx.db.project.findFirst({
                where: { id: projectId, userId, isActive: true },
            });

            if (!project) {
                throw new Error("Project not found or inactive");
            }

            const progress = await ctx.db.dailyProgress.findMany({
                where: {
                    projectId,
                    userId,
                    createdAt: {
                        gte: targetDate,
                        lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
                    },
                },
                orderBy: { createdAt: "asc" },
            });

            const total = await ctx.db.dailyProgress.count({
                where: {
                    projectId,
                    userId,
                    createdAt: {
                        gte: targetDate,
                        lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
                    },
                },
            });

            return {
                success: true,
                progress,
                total,
                hasMore: false, // No pagination for date range
            };
        }),

    // Get today's status for a project
    getTodayStatus: privateProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
            const { projectId } = input;
            const userId = ctx.user.id;

            // Get the project
            const project = await ctx.db.project.findFirst({
                where: { id: projectId, userId, isActive: true },
            });

            if (!project) {
                throw new Error("Project not found or inactive");
            }

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
            });

            // Get current streak status
            const stats = await ctx.db.userStreakStats.findFirst({
                where: { userId, projectId },
            });

            // Calculate current day number if project has started
            let currentDayNumber = null;
            if (project.startedAt) {
                const startDate = new Date(project.startedAt!);
                startDate.setHours(0, 0, 0, 0);
                currentDayNumber = Math.floor((today.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;
            }

            return {
                success: true,
                hasPostedToday: !!todayPost,
                todayPost,
                currentStreak: stats?.currentStreak ?? 0,
                currentDay: currentDayNumber,
                totalStreakDays: project.targetStreakDays,
                projectStarted: !!project.startedAt,
            };
        }),

    // Get streak calendar for a project (simplified date-based approach)
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



            // Get all posts for this project
            const allPosts = await ctx.db.dailyProgress.findMany({
                where: { projectId, userId },
                orderBy: { createdAt: "asc" },
            });

            // Calculate calendar data based on dates
            const startDate = new Date(project.startedAt!);
            startDate.setHours(0, 0, 0, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;
            const calendar = [];

            for (let day = 1; day <= Math.min(daysSinceStart, project.targetStreakDays); day++) {
                const targetDate = new Date(startDate.getTime() + (day - 1) * 24 * 60 * 60 * 1000);
                const dayPosts = allPosts.filter(post => {
                    const postDate = new Date(post.createdAt);
                    postDate.setHours(0, 0, 0, 0);
                    return postDate.getTime() === targetDate.getTime();
                });

                calendar.push({
                    dayNumber: day,
                    targetDate,
                    isPosted: dayPosts.length > 0,
                    isCompleted: dayPosts.length > 0,
                    hasProgress: dayPosts.length > 0,
                    progress: dayPosts[0] ?? null,
                });
            }

            const completedDays = calendar.filter(day => day.isCompleted).length;

            return {
                success: true,
                calendar,
                totalDays: project.targetStreakDays,
                completedDays,
                progressPercentage: Math.round((completedDays / project.targetStreakDays) * 100),
            };
        }),

    // Check if user can post today (simplified date-based logic)
    canPostToday: privateProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
            const { projectId } = input;
            const userId = ctx.user.id;

            // Get the project
            const project = await ctx.db.project.findFirst({
                where: { id: projectId, userId, isActive: true },
            });

            if (!project) {
                return {
                    success: false,
                    canPost: false,
                    reason: "Project not found or inactive",
                };
            }



            // Get today's date (start of day)
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Calculate current day number first
            const startDate = new Date(project.startedAt!);
            startDate.setHours(0, 0, 0, 0);
            const currentDayNumber = Math.floor((today.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;

            // Count how many posts exist for today
            const todayPostsCount = await ctx.db.dailyProgress.count({
                where: {
                    projectId,
                    userId,
                    createdAt: {
                        gte: today,
                        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
                    },
                },
            });

            // Check if user has reached the daily post limit
            const maxPostsPerDay = process.env.MAX_POSTS_PER_DAY ? parseInt(process.env.MAX_POSTS_PER_DAY) : 5;

            if (todayPostsCount >= maxPostsPerDay) {
                return {
                    success: false,
                    canPost: false,
                    reason: `You have already posted ${todayPostsCount} times today. Maximum allowed: ${maxPostsPerDay} posts per day.`,
                };
            } else {
                // User is under the daily limit, can post more
                // Check if we've exceeded the target streak days
                if (currentDayNumber > project!.targetStreakDays) {
                    return {
                        success: false,
                        canPost: false,
                        reason: "Project streak goal has been reached",
                    };
                }

                return {
                    success: true,
                    canPost: true,
                    currentDay: currentDayNumber,
                    targetDate: today,
                    reason: `You can post today. You have posted ${todayPostsCount} times and can post ${maxPostsPerDay - todayPostsCount} more times today.`,
                };
            }
        }),

    // Validate if user can post today (simplified consecutive day logic)
    validatePostingDate: privateProcedure
        .input(z.object({ projectId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const { projectId } = input;
            const userId = ctx.user.id;

            // Get the project
            const project = await ctx.db.project.findFirst({
                where: { id: projectId, userId, isActive: true },
            });

            if (!project) {
                return {
                    success: false,
                    isValidDate: false,
                    canPost: false,
                    reason: "Project not found or inactive",
                };
            }



            // Get today's date
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Count how many posts exist for today
            const todayPostsCount = await ctx.db.dailyProgress.count({
                where: {
                    projectId,
                    userId,
                    createdAt: {
                        gte: today,
                        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
                    },
                },
            });

            // Check if user has reached the daily post limit
            const maxPostsPerDay = process.env.MAX_POSTS_PER_DAY ? parseInt(process.env.MAX_POSTS_PER_DAY) : 5;

            if (todayPostsCount >= maxPostsPerDay) {
                return {
                    success: false,
                    isValidDate: false,
                    canPost: false,
                    reason: `You have already posted ${todayPostsCount} times today. Maximum allowed: ${maxPostsPerDay} posts per day.`,
                };
            } else {
                // User is under the daily limit, can post more
                return {
                    success: true,
                    isValidDate: true,
                    canPost: true,
                    reason: `You can post today. You have posted ${todayPostsCount} times and can post ${maxPostsPerDay - todayPostsCount} more times today.`,
                };
            }
        }),
});
