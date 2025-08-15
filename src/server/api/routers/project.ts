import { z } from "zod";
import { createTRPCRouter, privateProcedure } from "@/server/api/trpc";

// Input validation schemas
const createProjectSchema = z.object({
    name: z.string().min(1, "Project name is required"),
    description: z.string().optional(),
    categoryId: z.string().min(1, "Category is required"),
    targetStreakDays: z.number().int().min(1, "Streak days must be at least 1"),
});

const updateProjectSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    categoryId: z.string().min(1).optional(),
    isActive: z.boolean().optional(),
});

export const projectRouter = createTRPCRouter({
    // Create a new project with streak challenge
    create: privateProcedure
        .input(createProjectSchema)
        .mutation(async ({ ctx, input }) => {
            const { name, description, categoryId, targetStreakDays } = input;
            const userId = ctx.user.id;

            // Calculate start and end dates
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(startDate.getDate() + targetStreakDays - 1);

            // Create project
            const project = await ctx.db.project.create({
                data: {
                    name,
                    description,
                    categoryId,
                    userId,
                    targetStreakDays,
                    startDate,
                    endDate,
                },
                include: {
                    category: true,
                },
            });

            // Generate streak challenge days
            const streakDays = [];
            for (let day = 1; day <= targetStreakDays; day++) {
                const targetDate = new Date(startDate);
                targetDate.setDate(startDate.getDate() + day - 1);

                streakDays.push({
                    projectId: project.id,
                    userId,
                    dayNumber: day,
                    targetDate,
                });
            }

            // Create all streak days
            await ctx.db.streakChallenge.createMany({
                data: streakDays,
            });

            // Create initial streak stats
            await ctx.db.userStreakStats.create({
                data: {
                    userId,
                    projectId: project.id,
                    currentStreak: 0,
                    longestStreak: 0,
                    totalPosts: 0,
                    challengesCompleted: 0,
                },
            });

            return {
                success: true,
                project,
                message: `Project created with ${targetStreakDays}-day streak challenge!`,
            };
        }),

    // Get all projects for the current user
    getUserProjects: privateProcedure.query(async ({ ctx }) => {
        const userId = ctx.user.id;

        const projects = await ctx.db.project.findMany({
            where: { userId, isActive: true },
            include: {
                category: true,
                streakStats: true,
                _count: {
                    select: {
                        streakChallenges: true,
                        dailyProgress: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return {
            success: true,
            projects,
            count: projects.length,
        };
    }),

    // Get a single project with full details
    getProject: privateProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const userId = ctx.user.id;
            const { id } = input;

            const project = await ctx.db.project.findFirst({
                where: { id, userId },
                include: {
                    category: true,
                    streakStats: true,
                    streakChallenges: {
                        orderBy: { dayNumber: "asc" },
                        include: {
                            dailyProgress: true,
                        },
                    },
                    dailyProgress: {
                        orderBy: { createdAt: "desc" },
                        include: {
                            streakDay: true,
                        },
                    },
                },
            });

            if (!project) {
                throw new Error("Project not found");
            }

            return {
                success: true,
                project,
            };
        }),

    // Update project details
    update: privateProcedure
        .input(updateProjectSchema)
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.user.id;
            const { id, ...updateData } = input;

            const project = await ctx.db.project.findFirst({
                where: { id, userId },
            });

            if (!project) {
                throw new Error("Project not found");
            }

            const updatedProject = await ctx.db.project.update({
                where: { id },
                data: updateData,
                include: {
                    category: true,
                },
            });

            return {
                success: true,
                project: updatedProject,
                message: "Project updated successfully",
            };
        }),

    // Delete project (soft delete by setting isActive to false)
    delete: privateProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.user.id;
            const { id } = input;

            const project = await ctx.db.project.findFirst({
                where: { id, userId },
            });

            if (!project) {
                throw new Error("Project not found");
            }

            await ctx.db.project.update({
                where: { id },
                data: { isActive: false },
            });

            return {
                success: true,
                message: "Project deleted successfully",
            };
        }),

    // Extend project streak challenge
    extendStreak: privateProcedure
        .input(z.object({
            projectId: z.string(),
            additionalDays: z.number().int().min(1),
        }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.user.id;
            const { projectId, additionalDays } = input;

            const project = await ctx.db.project.findFirst({
                where: { id: projectId, userId },
                include: {
                    streakChallenges: {
                        orderBy: { dayNumber: "desc" },
                        take: 1,
                    },
                },
            });

            if (!project) {
                throw new Error("Project not found");
            }

            // Get the last day number
            const lastDayNumber = project.streakChallenges[0]?.dayNumber || 0;
            const newTargetDays = project.targetStreakDays + additionalDays;

            // Update project end date
            const updatedProject = await ctx.db.project.update({
                where: { id: projectId },
                data: {
                    targetStreakDays: newTargetDays,
                    endDate: new Date(project.endDate.getTime() + (additionalDays * 24 * 60 * 60 * 1000)),
                },
            });

            // Generate additional streak days
            const newStreakDays = [];
            for (let day = lastDayNumber + 1; day <= newTargetDays; day++) {
                const targetDate = new Date(project.startDate);
                targetDate.setDate(project.startDate.getDate() + day - 1);

                newStreakDays.push({
                    projectId,
                    userId,
                    dayNumber: day,
                    targetDate,
                });
            }

            // Create new streak days
            await ctx.db.streakChallenge.createMany({
                data: newStreakDays,
            });

            return {
                success: true,
                project: updatedProject,
                message: `Project extended by ${additionalDays} days! New target: ${newTargetDays} days`,
            };
        }),

    // Get project statistics
    getStats: privateProcedure
        .input(z.object({ projectId: z.string() }))
        .query(async ({ ctx, input }) => {
            const userId = ctx.user.id;
            const { projectId } = input;

            const stats = await ctx.db.userStreakStats.findFirst({
                where: { userId, projectId },
            });

            if (!stats) {
                throw new Error("Project stats not found");
            }

            return {
                success: true,
                stats,
            };
        }),
});
