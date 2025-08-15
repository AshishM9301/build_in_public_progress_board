import { z } from "zod";
import { createTRPCRouter, privateProcedure } from "@/server/api/trpc";

export const streakRouter = createTRPCRouter({
    // Get current streak progress for a project
    getStreakProgress: privateProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
            const { projectId } = input;
            const userId = ctx.user.id;

            // Get project and streak stats
            const [project, stats] = await Promise.all([
                ctx.db.project.findFirst({
                    where: { id: projectId, userId, isActive: true },
                }),
                ctx.db.userStreakStats.findFirst({
                    where: { userId, projectId },
                }),
            ]);

            if (!project) {
                throw new Error("Project not found or inactive");
            }

            if (!stats) {
                return {
                    success: true,
                    streakProgress: {
                        currentStreak: 0,
                        longestStreak: 0,
                        totalPosts: 0,
                        challengesCompleted: 0,
                        progressPercentage: 0,
                        remainingDays: project.targetStreakDays,
                        isCompleted: false,
                    },
                };
            }

            const progressPercentage = Math.round((stats.currentStreak / project.targetStreakDays) * 100);
            const remainingDays = Math.max(0, project.targetStreakDays - stats.currentStreak);
            const isCompleted = stats.currentStreak >= project.targetStreakDays;

            return {
                success: true,
                streakProgress: {
                    currentStreak: stats.currentStreak,
                    longestStreak: stats.longestStreak,
                    totalPosts: stats.totalPosts,
                    challengesCompleted: stats.challengesCompleted,
                    progressPercentage,
                    remainingDays,
                    isCompleted,
                },
            };
        }),

    // Check if streak is broken (missed a day)
    checkStreakStatus: privateProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
            const { projectId } = input;
            const userId = ctx.user.id;

            // Get project details
            const project = await ctx.db.project.findFirst({
                where: { id: projectId, userId, isActive: true },
                include: {
                    streakChallenges: {
                        orderBy: { dayNumber: "asc" },
                    },
                },
            });

            if (!project) {
                throw new Error("Project not found or inactive");
            }

            // Get today's date
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

            // Get the last posted streak day
            const lastPostedDay = await ctx.db.streakChallenge.findFirst({
                where: {
                    projectId,
                    userId,
                    isCompleted: true,
                },
                orderBy: { dayNumber: "desc" },
            });

            // Get the next expected streak day
            const nextExpectedDay = lastPostedDay
                ? await ctx.db.streakChallenge.findFirst({
                    where: {
                        projectId,
                        userId,
                        dayNumber: lastPostedDay.dayNumber + 1,
                    },
                })
                : await ctx.db.streakChallenge.findFirst({
                    where: {
                        projectId,
                        userId,
                        dayNumber: 1,
                    },
                });

            // Check if streak is broken
            let isStreakBroken = false;
            let missedDays = 0;
            let lastPostedDate = null;

            if (lastPostedDay) {
                lastPostedDate = lastPostedDay.targetDate;

                // Calculate days since last post
                const daysSinceLastPost = Math.floor((today.getTime() - lastPostedDate.getTime()) / (24 * 60 * 60 * 1000));

                if (daysSinceLastPost > 1) {
                    isStreakBroken = true;
                    missedDays = daysSinceLastPost - 1;
                }
            }

            return {
                success: true,
                streakStatus: {
                    isStreakBroken,
                    missedDays,
                    lastPostedDate,
                    nextExpectedDay: nextExpectedDay?.dayNumber || 1,
                    canPostToday: !todayPost && !isStreakBroken,
                    todayPost,
                },
            };
        }),

    // Reset streak challenge (start over)
    resetStreak: privateProcedure
        .input(z.object({ projectId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const { projectId } = input;
            const userId = ctx.user.id;

            // Get project details
            const project = await ctx.db.project.findFirst({
                where: { id: projectId, userId, isActive: true },
            });

            if (!project) {
                throw new Error("Project not found or inactive");
            }

            // Reset all streak challenges to not completed
            await ctx.db.streakChallenge.updateMany({
                where: { projectId, userId },
                data: {
                    isPosted: false,
                    isCompleted: false,
                },
            });

            // Reset streak stats
            await ctx.db.userStreakStats.updateMany({
                where: { userId, projectId },
                data: {
                    currentStreak: 0,
                    lastPostedDate: null,
                },
            });

            // Update project start date to today
            const newStartDate = new Date();
            const newEndDate = new Date();
            newEndDate.setDate(newStartDate.getDate() + project.targetStreakDays - 1);

            await ctx.db.project.update({
                where: { id: projectId },
                data: {
                    startDate: newStartDate,
                    endDate: newEndDate,
                },
            });

            // Update target dates for all streak challenges
            const streakChallenges = await ctx.db.streakChallenge.findMany({
                where: { projectId, userId },
                orderBy: { dayNumber: "asc" },
            });

            for (const challenge of streakChallenges) {
                const newTargetDate = new Date(newStartDate);
                newTargetDate.setDate(newStartDate.getDate() + challenge.dayNumber - 1);

                await ctx.db.streakChallenge.update({
                    where: { id: challenge.id },
                    data: { targetDate: newTargetDate },
                });
            }

            return {
                success: true,
                message: "Streak challenge reset successfully. You can start over from Day 1!",
                newStartDate,
                newEndDate,
            };
        }),

    // Get streak calendar view
    getStreakCalendar: privateProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
            const { projectId } = input;
            const userId = ctx.user.id;

            // Get project and all streak challenges
            const project = await ctx.db.project.findFirst({
                where: { id: projectId, userId, isActive: true },
                include: {
                    streakChallenges: {
                        orderBy: { dayNumber: "asc" },
                        include: {
                            dailyProgress: true,
                        },
                    },
                },
            });

            if (!project) {
                throw new Error("Project not found or inactive");
            }

            // Format calendar data
            const calendar = project.streakChallenges.map(challenge => ({
                dayNumber: challenge.dayNumber,
                targetDate: challenge.targetDate,
                isPosted: challenge.isPosted,
                isCompleted: challenge.isCompleted,
                hasProgress: challenge.dailyProgress.length > 0,
                progress: challenge.dailyProgress[0] || null,
                isToday: challenge.targetDate.toDateString() === new Date().toDateString(),
                isPast: challenge.targetDate < new Date(),
                isFuture: challenge.targetDate > new Date(),
            }));

            // Group by weeks for calendar display
            const weeks = [];
            let currentWeek = [];

            for (const day of calendar) {
                currentWeek.push(day);

                if (currentWeek.length === 7 || day.dayNumber === project.targetStreakDays) {
                    weeks.push(currentWeek);
                    currentWeek = [];
                }
            }

            return {
                success: true,
                calendar: {
                    weeks,
                    totalDays: project.targetStreakDays,
                    completedDays: calendar.filter(day => day.isCompleted).length,
                    progressPercentage: Math.round((calendar.filter(day => day.isCompleted).length / project.targetStreakDays) * 100),
                },
            };
        }),

    // Get streak statistics and achievements
    getStreakStats: privateProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
            const { projectId } = input;
            const userId = ctx.user.id;

            // Get streak stats
            const stats = await ctx.db.userStreakStats.findFirst({
                where: { userId, projectId },
            });

            if (!stats) {
                return {
                    success: true,
                    stats: {
                        currentStreak: 0,
                        longestStreak: 0,
                        totalPosts: 0,
                        challengesCompleted: 0,
                        averagePostsPerDay: 0,
                        streakEfficiency: 0,
                    },
                };
            }

            // Calculate additional statistics
            const project = await ctx.db.project.findFirst({
                where: { id: projectId, userId },
            });

            if (!project) {
                throw new Error("Project not found");
            }

            const daysSinceStart = Math.ceil((new Date().getTime() - project.startDate.getTime()) / (24 * 60 * 60 * 1000));
            const averagePostsPerDay = daysSinceStart > 0 ? (stats.totalPosts / daysSinceStart) : 0;
            const streakEfficiency = project.targetStreakDays > 0 ? (stats.currentStreak / project.targetStreakDays) * 100 : 0;

            return {
                success: true,
                stats: {
                    currentStreak: stats.currentStreak,
                    longestStreak: stats.longestStreak,
                    totalPosts: stats.totalPosts,
                    challengesCompleted: stats.challengesCompleted,
                    averagePostsPerDay: Math.round(averagePostsPerDay * 100) / 100,
                    streakEfficiency: Math.round(streakEfficiency),
                    daysSinceStart,
                    targetDays: project.targetStreakDays,
                },
            };
        }),

    // Get streak milestones and achievements
    getStreakMilestones: privateProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
            const { projectId } = input;
            const userId = ctx.user.id;

            // Get streak stats
            const stats = await ctx.db.userStreakStats.findFirst({
                where: { userId, projectId },
            });

            if (!stats) {
                return {
                    success: true,
                    milestones: [],
                    nextMilestone: null,
                };
            }

            // Define milestone thresholds
            const milestones = [
                { day: 1, name: "First Day", description: "Started your journey", icon: "🌱" },
                { day: 3, name: "Getting Started", description: "Building momentum", icon: "🚀" },
                { day: 7, name: "Week Warrior", description: "One week strong", icon: "💪" },
                { day: 14, name: "Fortnight Fighter", description: "Two weeks of consistency", icon: "⚔️" },
                { day: 30, name: "Monthly Master", description: "One month of dedication", icon: "👑" },
                { day: 60, name: "Quarterly Champion", description: "Three months strong", icon: "🏆" },
                { day: 100, name: "Century Legend", description: "100 days of excellence", icon: "🌟" },
            ];

            // Find achieved and upcoming milestones
            const achievedMilestones = milestones.filter(m => stats.currentStreak >= m.day);
            const nextMilestone = milestones.find(m => stats.currentStreak < m.day);

            return {
                success: true,
                milestones: achievedMilestones,
                nextMilestone,
                currentStreak: stats.currentStreak,
                totalMilestones: milestones.length,
                achievedCount: achievedMilestones.length,
            };
        }),
});
