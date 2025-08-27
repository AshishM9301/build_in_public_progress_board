import { z } from "zod";
import { createTRPCRouter, privateProcedure } from "@/server/api/trpc";

// Input validation schemas
const createProjectSchema = z.object({
    name: z.string().min(1, "Project name is required"),
    description: z.string().optional(),
    categoryIds: z.array(z.string()).min(1, "At least one category is required"),
    targetStreakDays: z.number().int().min(1, "Streak days must be at least 1"),
    // startDate: z.date().optional(), // Commented out - will use start button on project page instead
});

const updateProjectSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    categoryIds: z.array(z.string()).min(1, "At least one category is required").optional(),
    isActive: z.boolean().optional(),
});

export const projectRouter = createTRPCRouter({
    // Create a new project with streak challenge
    create: privateProcedure
        .input(createProjectSchema)
        .mutation(async ({ ctx, input }) => {
            const { name, description, categoryIds, targetStreakDays } = input;
            const userId = ctx.user.id;

            // Calculate start and end dates - commented out for now, will use start button on project page
            // const projectStartDate = startDate || new Date();
            // const endDate = new Date(projectStartDate);
            // endDate.setDate(projectStartDate.getDate() + targetStreakDays - 1);
            
            // For now, create project without start/end dates - they'll be set when user clicks start button
            // const projectStartDate = null; // Will be set when project is started
            // const endDate = null; // Will be calculated when project is started

            // Create project
            const project = await ctx.db.project.create({
                data: {
                    name,
                    description,
                    userId,
                    targetStreakDays,
                    // startDate and endDate will be set when user clicks start button
                },
                include: {
                    categories: {
                        include: {
                            category: true,
                        },
                    },
                },
            });

            // Create project-category relationships
            const projectCategories = categoryIds.map(categoryId => ({
                projectId: project.id,
                categoryId,
            }));

            await ctx.db.projectCategory.createMany({
                data: projectCategories,
            });

            // Generate streak challenge days - commented out for now, will be created when project is started
            // const streakDays = [];
            // for (let day = 1; day <= targetStreakDays; day++) {
            //     const targetDate = new Date(projectStartDate);
            //     targetDate.setDate(projectStartDate.getDate() + day - 1);

            //     streakDays.push({
            //         projectId: project.id,
            //         userId,
            //         dayNumber: day,
            //         targetDate,
            //     });
            // }

            // Create all streak days - commented out for now
            // await ctx.db.streakChallenge.createMany({
            //     data: streakDays,
            // });

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

            // Fetch the project with updated category information
            const updatedProject = await ctx.db.project.findUnique({
                where: { id: project.id },
                include: {
                    categories: {
                        include: {
                            category: true,
                        },
                    },
                },
            });

            return {
                success: true,
                project: updatedProject,
                message: `Project created with ${targetStreakDays}-day streak challenge!`,
            };
        }),

    // Get all projects for the current user
    getUserProjects: privateProcedure.query(async ({ ctx }) => {
        const userId = ctx.user.id;

        const projects = await ctx.db.project.findMany({
            where: { userId, isActive: true },
            include: {
                categories: {
                    include: {
                        category: true,
                    },
                },
                streakStats: true,
                _count: {
                    select: {
                        streakChallenges: true,
                        dailyProgress: true,
                    },
                },
            },
        });

        return {
            success: true,
            projects,
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
                    categories: {
                        include: {
                            category: true,
                        },
                    },
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
            const { id, categoryIds, ...updateData } = input;

            const project = await ctx.db.project.findFirst({
                where: { id, userId },
            });

            if (!project) {
                throw new Error("Project not found");
            }

            // Update project basic info
            const updatedProject = await ctx.db.project.update({
                where: { id },
                data: updateData,
                include: {
                    categories: {
                        include: {
                            category: true,
                        },
                    },
                },
            });

            // Update categories if provided
            if (categoryIds) {
                // Remove existing category relationships
                await ctx.db.projectCategory.deleteMany({
                    where: { projectId: id },
                });

                // Create new category relationships
                const projectCategories = categoryIds.map(categoryId => ({
                    projectId: id,
                    categoryId,
                }));

                await ctx.db.projectCategory.createMany({
                    data: projectCategories,
                });

                // Fetch updated project with new categories
                const finalProject = await ctx.db.project.findUnique({
                    where: { id },
                    include: {
                        categories: {
                            include: {
                                category: true,
                            },
                        },
                    },
                });

                return {
                    success: true,
                    project: finalProject,
                    message: "Project updated successfully!",
                };
            }

            return {
                success: true,
                project: updatedProject,
                message: "Project updated successfully!",
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
            const lastDayNumber = project.streakChallenges[0]?.dayNumber ?? 0;
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

    // Start a project (set start date and create streak challenges)
    startProject: privateProcedure
        .input(z.object({ projectId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.user.id;
            const { projectId } = input;

            const project = await ctx.db.project.findFirst({
                where: { id: projectId, userId },
            });

            if (!project) {
                throw new Error("Project not found");
            }

            if (project.startedAt) {
                throw new Error("Project has already been started");
            }

            // Set start date to now
            const startDate = new Date();
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + project.targetStreakDays - 1);

            // Update project with start date
            const updatedProject = await ctx.db.project.update({
                where: { id: projectId },
                data: {
                    startDate,
                    endDate,
                    startedAt: startDate,
                },
            });

            // Generate streak challenge days
            const streakDays = [];
            for (let day = 1; day <= project.targetStreakDays; day++) {
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

            return {
                success: true,
                project: updatedProject,
                message: `Project started! Your ${project.targetStreakDays}-day streak challenge begins now.`,
            };
        }),
});
