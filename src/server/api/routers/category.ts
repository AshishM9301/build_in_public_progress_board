import { z } from "zod";
import { createTRPCRouter, privateProcedure } from "@/server/api/trpc";

// Input validation schemas
const createCategorySchema = z.object({
    name: z.string().min(1, "Category name is required"),
});

const updateCategorySchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1, "Category name is required"),
});

export const categoryRouter = createTRPCRouter({
    // Create a new category
    create: privateProcedure
        .input(createCategorySchema)
        .mutation(async ({ ctx, input }) => {
            const { name } = input;
            const userId = ctx.user.id;

            // Check if category already exists for this user
            const existingCategory = await ctx.db.category.findFirst({
                where: { name, userId },
            });

            if (existingCategory) {
                throw new Error("Category with this name already exists");
            }

            const category = await ctx.db.category.create({
                data: {
                    name,
                    userId,
                },
            });

            return {
                success: true,
                category,
                message: "Category created successfully",
            };
        }),

    // Get all categories for the current user
    getUserCategories: privateProcedure.query(async ({ ctx }) => {
        const userId = ctx.user.id;

        const categories = await ctx.db.category.findMany({
            where: { userId },
            include: {
                _count: {
                    select: {
                        projects: true,
                    },
                },
            },
            orderBy: { name: "asc" },
        });

        return {
            success: true,
            categories,
            count: categories.length,
        };
    }),

    // Get a single category
    getCategory: privateProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const userId = ctx.user.id;
            const { id } = input;

            const category = await ctx.db.category.findFirst({
                where: { id, userId },
                include: {
                    projects: {
                        where: { isActive: true },
                        include: {
                            streakStats: true,
                        },
                    },
                },
            });

            if (!category) {
                throw new Error("Category not found");
            }

            return {
                success: true,
                category,
            };
        }),

    // Update category
    update: privateProcedure
        .input(updateCategorySchema)
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.user.id;
            const { id, name } = input;

            const category = await ctx.db.category.findFirst({
                where: { id, userId },
            });

            if (!category) {
                throw new Error("Category not found");
            }

            // Check if new name conflicts with existing category
            const existingCategory = await ctx.db.category.findFirst({
                where: { name, userId, id: { not: id } },
            });

            if (existingCategory) {
                throw new Error("Category with this name already exists");
            }

            const updatedCategory = await ctx.db.category.update({
                where: { id },
                data: { name },
            });

            return {
                success: true,
                category: updatedCategory,
                message: "Category updated successfully",
            };
        }),

    // Delete category (only if no projects are using it)
    delete: privateProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.user.id;
            const { id } = input;

            const category = await ctx.db.category.findFirst({
                where: { id, userId },
                include: {
                    _count: {
                        select: {
                            projects: true,
                        },
                    },
                },
            });

            if (!category) {
                throw new Error("Category not found");
            }

            if (category._count.projects > 0) {
                throw new Error("Cannot delete category that has projects. Please delete or move the projects first.");
            }

            await ctx.db.category.delete({
                where: { id },
            });

            return {
                success: true,
                message: "Category deleted successfully",
            };
        }),

    // Get categories with project counts (for dropdowns)
    getCategoriesForSelect: privateProcedure.query(async ({ ctx }) => {
        const userId = ctx.user.id;

        const categories = await ctx.db.category.findMany({
            where: { userId },
            select: {
                id: true,
                name: true,
                _count: {
                    select: {
                        projects: true,
                    },
                },
            },
            orderBy: { name: "asc" },
        });

        return {
            success: true,
            categories: categories.map(cat => ({
                id: cat.id,
                name: cat.name,
                projectCount: cat._count.projects,
            })),
        };
    }),
});
