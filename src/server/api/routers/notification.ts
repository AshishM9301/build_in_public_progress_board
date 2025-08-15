import { z } from "zod";
import { createTRPCRouter, privateProcedure } from "@/server/api/trpc";

export const notificationRouter = createTRPCRouter({
  // Send streak reminder notification
  sendStreakReminder: privateProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { projectId } = input;
      const userId = ctx.user.id;

      // Get project details
      const project = await ctx.db.project.findFirst({
        where: { id: projectId, userId, isActive: true },
        include: {
          streakStats: true,
        },
      });

      if (!project) {
        throw new Error("Project not found or inactive");
      }

      // Get today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if user has posted today
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
          message: "User has already posted today",
        };
      }

      // Get current streak status
      const stats = project.streakStats;
      const currentStreak = stats?.currentStreak || 0;

      // Create notification message based on streak status
      let message = "";
      let type = "reminder";

      if (currentStreak === 0) {
        message = `Don't break your streak! Post your progress for ${project.name} today.`;
        type = "warning";
      } else if (currentStreak < 7) {
        message = `Keep building your habit! Day ${currentStreak + 1} of ${project.targetStreakDays} is waiting for your progress update.`;
        type = "reminder";
      } else if (currentStreak < 30) {
        message = `Great momentum! Don't let it slip. Post your Day ${currentStreak + 1} progress for ${project.name}.`;
        type = "reminder";
      } else {
        message = `Incredible streak! You're on Day ${currentStreak}. Don't break it now - post your progress!`;
        type = "motivation";
      }

      // In a real app, you would send this notification via email, push notification, etc.
      // For now, we'll return the notification data
      const notification = {
        id: `streak-reminder-${projectId}-${Date.now()}`,
        userId,
        projectId,
        type,
        message,
        title: "Streak Reminder",
        createdAt: new Date(),
        isRead: false,
      };

      return {
        success: true,
        notification,
        message: "Streak reminder sent successfully",
      };
    }),

  // Send badge earned notification
  sendBadgeNotification: privateProcedure
    .input(z.object({
      badgeId: z.string(),
      projectId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { badgeId, projectId } = input;
      const userId = ctx.user.id;

      // Get badge and project details
      const [badge, project] = await Promise.all([
        ctx.db.badge.findUnique({ where: { id: badgeId } }),
        ctx.db.project.findFirst({ where: { id: projectId, userId } }),
      ]);

      if (!badge || !project) {
        throw new Error("Badge or project not found");
      }

      // Create celebration message
      const message = `🎉 Congratulations! You've earned the ${badge.name} badge for ${project.name}!`;
      
      const notification = {
        id: `badge-earned-${badgeId}-${projectId}-${Date.now()}`,
        userId,
        projectId,
        badgeId,
        type: "achievement",
        message,
        title: "Badge Earned!",
        createdAt: new Date(),
        isRead: false,
      };

      return {
        success: true,
        notification,
        message: "Badge notification sent successfully",
      };
    }),

  // Send challenge completion notification
  sendChallengeComplete: privateProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { projectId } = input;
      const userId = ctx.user.id;

      // Get project details
      const project = await ctx.db.project.findFirst({
        where: { id: projectId, userId, isActive: true },
        include: {
          streakStats: true,
        },
      });

      if (!project) {
        throw new Error("Project not found or inactive");
      }

      const stats = project.streakStats;
      if (!stats || stats.currentStreak < project.targetStreakDays) {
        return {
          success: false,
          message: "Challenge not yet completed",
        };
      }

      // Create completion celebration message
      const message = `🏆 CHALLENGE COMPLETE! You've successfully completed ${project.targetStreakDays} consecutive days of posting for ${project.name}! What's your next challenge?`;

      const notification = {
        id: `challenge-complete-${projectId}-${Date.now()}`,
        userId,
        projectId,
        type: "celebration",
        message,
        title: "Challenge Complete! 🎉",
        createdAt: new Date(),
        isRead: false,
      };

      return {
        success: true,
        notification,
        message: "Challenge completion notification sent successfully",
      };
    }),

  // Get all notifications for the current user
  getUserNotifications: privateProcedure
    .input(z.object({
      limit: z.number().int().min(1).max(50).optional().default(20),
      offset: z.number().int().min(0).optional().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const { limit, offset } = input;
      const userId = ctx.user.id;

      // In a real app, you would have a notifications table
      // For now, we'll return a mock structure
      const notifications = [
        {
          id: "mock-notification-1",
          userId,
          type: "reminder",
          message: "Don't forget to post your daily progress!",
          title: "Daily Reminder",
          createdAt: new Date(),
          isRead: false,
        },
      ];

      return {
        success: true,
        notifications,
        count: notifications.length,
        hasMore: false,
      };
    }),

  // Mark notification as read
  markAsRead: privateProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { notificationId } = input;
      const userId = ctx.user.id;

      // In a real app, you would update the notification in the database
      // For now, we'll return success

      return {
        success: true,
        message: "Notification marked as read",
      };
    }),

  // Get notification count for unread notifications
  getUnreadCount: privateProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    // In a real app, you would count unread notifications from the database
    // For now, we'll return a mock count

    return {
      success: true,
      unreadCount: 0,
    };
  }),

  // Send streak break notification (when user misses a day)
  sendStreakBreakNotification: privateProcedure
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

      const message = `😔 Your streak for ${project.name} has been broken. Don't give up! Start your challenge again and build a new streak!`;

      const notification = {
        id: `streak-break-${projectId}-${Date.now()}`,
        userId,
        projectId,
        type: "streak-break",
        message,
        title: "Streak Broken",
        createdAt: new Date(),
        isRead: false,
      };

      return {
        success: true,
        notification,
        message: "Streak break notification sent successfully",
      };
    }),

  // Send motivational notification based on streak progress
  sendMotivationalNotification: privateProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { projectId } = input;
      const userId = ctx.user.id;

      // Get project and streak stats
      const project = await ctx.db.project.findFirst({
        where: { id: projectId, userId, isActive: true },
        include: {
          streakStats: true,
        },
      });

      if (!project) {
        throw new Error("Project not found or inactive");
      }

      const stats = project.streakStats;
      if (!stats) {
        return {
          success: false,
          message: "No streak stats found",
        };
      }

      const currentStreak = stats.currentStreak;
      const targetDays = project.targetStreakDays;
      const progressPercentage = Math.round((currentStreak / targetDays) * 100);

      let message = "";
      let type = "motivation";

      if (progressPercentage >= 90) {
        message = `🔥 You're so close! Just ${targetDays - currentStreak} more days to complete your ${targetDays}-day challenge for ${project.name}!`;
        type = "motivation";
      } else if (progressPercentage >= 75) {
        message = `🚀 Amazing progress! You're ${progressPercentage}% through your challenge. Keep pushing forward!`;
        type = "motivation";
      } else if (progressPercentage >= 50) {
        message = `💪 Halfway there! You've completed ${currentStreak} of ${targetDays} days. You're building a great habit!`;
        type = "motivation";
      } else if (progressPercentage >= 25) {
        message = `🌟 Great start! You're ${progressPercentage}% through your challenge. Consistency is key!`;
        type = "motivation";
      } else {
        message = `✨ Every journey begins with a single step. You're on Day ${currentStreak} of ${targetDays}. Keep going!`;
        type = "motivation";
      }

      const notification = {
        id: `motivational-${projectId}-${Date.now()}`,
        userId,
        projectId,
        type,
        message,
        title: "Motivational Message",
        createdAt: new Date(),
        isRead: false,
      };

      return {
        success: true,
        notification,
        message: "Motivational notification sent successfully",
      };
    }),
});
