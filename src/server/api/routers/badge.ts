import { z } from "zod";
import { createTRPCRouter, privateProcedure } from "@/server/api/trpc";

export const badgeRouter = createTRPCRouter({
  // Get all available badges
  getAllBadges: privateProcedure.query(async ({ ctx }) => {
    const badges = await ctx.db.badge.findMany({
      orderBy: { criteria: "asc" },
    });

    return {
      success: true,
      badges,
      count: badges.count,
    };
  }),

  // Get badges earned by the current user
  getUserBadges: privateProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    const userBadges = await ctx.db.userBadge.findMany({
      where: { userId },
      include: {
        badge: true,
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { earnedAt: "desc" },
    });

    return {
      success: true,
      userBadges,
      count: userBadges.length,
    };
  }),

  // Check if user is eligible for new badges
  checkBadgeEligibility: privateProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      const userId = ctx.user.id;

      // Get user's streak stats for this project
      const stats = await ctx.db.userStreakStats.findFirst({
        where: { userId, projectId },
      });

      if (!stats) {
        return {
          success: true,
          eligibleBadges: [],
          message: "No streak stats found for this project",
        };
      }

      // Get all available badges
      const allBadges = await ctx.db.badge.findMany({
        orderBy: { criteria: "asc" },
      });

      // Get badges already earned for this project
      const earnedBadges = await ctx.db.userBadge.findMany({
        where: { userId, projectId },
        select: { badgeId: true },
      });

      const earnedBadgeIds = earnedBadges.map(eb => eb.badgeId);

      // Check eligibility based on current streak
      const eligibleBadges = allBadges.filter(badge => {
        // User hasn't earned this badge for this project
        const notEarned = !earnedBadgeIds.includes(badge.id);
        // User meets the criteria
        const meetsCriteria = stats.currentStreak >= badge.criteria;

        return notEarned && meetsCriteria;
      });

      return {
        success: true,
        eligibleBadges,
        currentStreak: stats.currentStreak,
        earnedBadges: earnedBadgeIds,
      };
    }),

  // Award a badge to a user
  awardBadge: privateProcedure
    .input(z.object({
      badgeId: z.string(),
      projectId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { badgeId, projectId } = input;
      const userId = ctx.user.id;

      // Verify the badge exists
      const badge = await ctx.db.badge.findUnique({
        where: { id: badgeId },
      });

      if (!badge) {
        throw new Error("Badge not found");
      }

      // Verify project ownership
      const project = await ctx.db.project.findFirst({
        where: { id: projectId, userId, isActive: true },
      });

      if (!project) {
        throw new Error("Project not found or inactive");
      }

      // Check if user already has this badge for this project
      const existingBadge = await ctx.db.userBadge.findFirst({
        where: { userId, badgeId, projectId },
      });

      if (existingBadge) {
        throw new Error("User already has this badge for this project");
      }

      // Award the badge
      const userBadge = await ctx.db.userBadge.create({
        data: {
          userId,
          badgeId,
          projectId,
        },
        include: {
          badge: true,
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return {
        success: true,
        userBadge,
        message: `Congratulations! You earned the ${badge.name} badge!`,
      };
    }),

  // Get badge progress for a project
  getBadgeProgress: privateProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { projectId } = input;
      const userId = ctx.user.id;

      // Get user's streak stats
      const stats = await ctx.db.userStreakStats.findFirst({
        where: { userId, projectId },
      });

      if (!stats) {
        return {
          success: true,
          badgeProgress: [],
          currentStreak: 0,
        };
      }

      // Get all available badges
      const allBadges = await ctx.db.badge.findMany({
        orderBy: { criteria: "asc" },
      });

      // Get earned badges for this project
      const earnedBadges = await ctx.db.userBadge.findMany({
        where: { userId, projectId },
        include: { badge: true },
      });

      const earnedBadgeIds = earnedBadges.map(eb => eb.badgeId);

      // Create badge progress data
      const badgeProgress = allBadges.map(badge => {
        const isEarned = earnedBadgeIds.includes(badge.id);
        const progress = Math.min((stats.currentStreak / badge.criteria) * 100, 100);
        const isEligible = stats.currentStreak >= badge.criteria;

        return {
          badge,
          isEarned,
          progress: Math.round(progress),
          isEligible,
          earnedAt: earnedBadges.find(eb => eb.badgeId === badge.id)?.earnedAt || null,
        };
      });

      return {
        success: true,
        badgeProgress,
        currentStreak: stats.currentStreak,
        totalBadges: allBadges.length,
        earnedBadges: earnedBadges.length,
      };
    }),

  // Get overview badge stats for the user (all projects)
  getOverviewBadgeStats: privateProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    // Get all available badges
    const allBadges = await ctx.db.badge.findMany({
      orderBy: { criteria: "asc" },
    });

    // Get all badges earned by the user
    const userBadges = await ctx.db.userBadge.findMany({
      where: { userId },
      include: { badge: true },
    });

    // Get user's overall streak stats across all projects
    const overallStats = await ctx.db.userStreakStats.findMany({
      where: { userId },
    });

    const totalEarnedBadges = userBadges.length;
    const totalAvailableBadges = allBadges.length;
    const uniqueEarnedBadges = new Set(userBadges.map(ub => ub.badgeId)).size;

    return {
      success: true,
      totalBadges: totalAvailableBadges,
      earnedBadges: uniqueEarnedBadges,
      totalEarnedInstances: totalEarnedBadges,
      badgeProgress: allBadges.map(badge => {
        const earnedInstances = userBadges.filter(ub => ub.badgeId === badge.id).length;
        const isEarned = earnedInstances > 0;

        return {
          badge,
          isEarned,
          earnedInstances,
        };
      }),
    };
  }),

  // Get recent badge achievements
  getRecentBadges: privateProcedure
    .input(z.object({ limit: z.number().int().min(1).max(20).optional().default(10) }))
    .query(async ({ ctx, input }) => {
      const { limit } = input;
      const userId = ctx.user.id;

      const recentBadges = await ctx.db.userBadge.findMany({
        where: { userId },
        include: {
          badge: true,
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { earnedAt: "desc" },
        take: limit,
      });

      return {
        success: true,
        recentBadges,
        count: recentBadges.length,
      };
    }),

  // Get badge leaderboard (optional feature)
  getBadgeLeaderboard: privateProcedure.query(async ({ ctx }) => {
    // Get users with most badges
    const leaderboard = await ctx.db.userBadge.groupBy({
      by: ['userId'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    // Get user details for leaderboard
    const leaderboardWithUsers = await Promise.all(
      leaderboard.map(async (entry) => {
        const user = await ctx.db.user.findUnique({
          where: { id: entry.userId },
          select: {
            id: true,
            name: true,
            image: true,
          },
        });

        return {
          userId: entry.userId,
          user,
          badgeCount: entry._count.id,
        };
      })
    );

    return {
      success: true,
      leaderboard: leaderboardWithUsers,
    };
  }),
});
