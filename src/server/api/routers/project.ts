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



            // Calculate start and end dates immediately when project is created
            const projectStartDate = new Date();
            const endDate = new Date(projectStartDate);
            endDate.setDate(projectStartDate.getDate() + targetStreakDays - 1);

            // Create project with start date set immediately
            const project = await ctx.db.project.create({
                data: {
                    name,
                    description,
                    userId,
                    targetStreakDays,
                    startDate: projectStartDate,
                    endDate: endDate,
                    startedAt: projectStartDate, // Set startedAt immediately
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
                        dailyProgress: true,
                    },
                },
            },
        });

        // Debug logging to identify potential duplicates
        console.log(`[getUserProjects] Found ${projects.length} projects for user ${userId}`);

        // Check for duplicate IDs
        const projectIds = projects.map(p => p.id);
        const uniqueIds = new Set(projectIds);
        if (projectIds.length !== uniqueIds.size) {
            console.error(`[getUserProjects] Duplicate project IDs found for user ${userId}:`,
                projectIds.filter((id, index) => projectIds.indexOf(id) !== index));
        }

        // Check for duplicate names
        const projectNames = projects.map(p => p.name);
        const uniqueNames = new Set(projectNames);
        if (projectNames.length !== uniqueNames.size) {
            console.warn(`[getUserProjects] Duplicate project names found for user ${userId}:`,
                projectNames.filter((name, index) => projectNames.indexOf(name) !== index));
        }

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
                            dailyProgress: {
                                orderBy: { createdAt: "desc" },
                            },
                        },
                    },
                    dailyProgress: {
                        orderBy: { createdAt: "desc" },
                    },
                },
            });

            if (!project) {
                throw new Error("Project not found");
            }

            // Calculate progress based on unique days with posts, not total posts
            const uniqueDaysWithPosts = new Set();
            const completedStreakDays = new Set();

            // Count unique days from dailyProgress
            project.dailyProgress?.forEach(progress => {
                const dayKey = progress.createdAt.toDateString();
                uniqueDaysWithPosts.add(dayKey);
            });

            // Count completed streak challenges
            project.streakChallenges?.forEach(challenge => {
                if (challenge.isCompleted || challenge.dailyProgress.length > 0) {
                    completedStreakDays.add(challenge.dayNumber);
                }
            });

            // Add computed progress data
            const projectWithProgress = {
                ...project,
                progressStats: {
                    uniqueDaysWithPosts: uniqueDaysWithPosts.size,
                    completedStreakDays: completedStreakDays.size,
                    totalPosts: project.dailyProgress?.length ?? 0,
                    completionPercentage: project.targetStreakDays > 0
                        ? Math.round((uniqueDaysWithPosts.size / project.targetStreakDays) * 100)
                        : 0,
                },
            };

            return {
                success: true,
                project: projectWithProgress,
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

    // Extend project streak days (date-based approach)
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
            });

            if (!project) {
                throw new Error("Project not found");
            }



            const newTargetDays = project.targetStreakDays + additionalDays;

            // Update project end date
            const updatedProject = await ctx.db.project.update({
                where: { id: projectId },
                data: {
                    targetStreakDays: newTargetDays,
                    endDate: new Date(project.endDate!.getTime() + (additionalDays * 24 * 60 * 60 * 1000)),
                },
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
