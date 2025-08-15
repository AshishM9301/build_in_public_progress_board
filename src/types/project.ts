// Project Types
export interface Project {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  userId: string;
  targetStreakDays: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  category?: Category;
  streakStats?: UserStreakStats;
  _count?: {
    streakChallenges: number;
    dailyProgress: number;
  };
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  categoryId: string;
  targetStreakDays: number;
}

export interface UpdateProjectInput {
  id: string;
  name?: string;
  description?: string;
  categoryId?: string;
  isActive?: boolean;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  userId: string;
  createdAt: Date;
  projects?: Project[];
  _count?: {
    projects: number;
  };
}

export interface CreateCategoryInput {
  name: string;
}

export interface UpdateCategoryInput {
  id: string;
  name: string;
}

// Streak Challenge Types
export interface StreakChallenge {
  id: string;
  projectId: string;
  userId: string;
  dayNumber: number;
  targetDate: Date;
  isPosted: boolean;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  project?: Project;
  user?: User;
  dailyProgress?: DailyProgress[];
}

// Daily Progress Types
export interface DailyProgress {
  id: string;
  projectId: string;
  streakDayId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  project?: Project;
  streakDay?: StreakChallenge;
  user?: User;
}

export interface CreateDailyPostInput {
  projectId: string;
  content: string;
}

// Badge Types
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: number;
  createdAt: Date;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  projectId?: string;
  earnedAt: Date;
  badge?: Badge;
  project?: {
    id: string;
    name: string;
  };
}

// User Streak Stats Types
export interface UserStreakStats {
  id: string;
  userId: string;
  projectId: string;
  currentStreak: number;
  longestStreak: number;
  totalPosts: number;
  challengesCompleted: number;
  lastPostedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  project?: Project;
}

// Streak Progress Types
export interface StreakProgress {
  currentStreak: number;
  longestStreak: number;
  totalPosts: number;
  challengesCompleted: number;
  progressPercentage: number;
  remainingDays: number;
  isCompleted: boolean;
}

// Streak Status Types
export interface StreakStatus {
  isStreakBroken: boolean;
  missedDays: number;
  lastPostedDate: Date | null;
  nextExpectedDay: number;
  canPostToday: boolean;
  todayPost: DailyProgress | null;
}

// Streak Calendar Types
export interface StreakCalendarDay {
  dayNumber: number;
  targetDate: Date;
  isPosted: boolean;
  isCompleted: boolean;
  hasProgress: boolean;
  progress: DailyProgress | null;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
}

export interface StreakCalendar {
  weeks: StreakCalendarDay[][];
  totalDays: number;
  completedDays: number;
  progressPercentage: number;
}

// Streak Stats Types
export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalPosts: number;
  challengesCompleted: number;
  averagePostsPerDay: number;
  streakEfficiency: number;
  daysSinceStart: number;
  targetDays: number;
}

// Streak Milestone Types
export interface StreakMilestone {
  day: number;
  name: string;
  description: string;
  icon: string;
}

export interface StreakMilestones {
  milestones: StreakMilestone[];
  nextMilestone: StreakMilestone | null;
  currentStreak: number;
  totalMilestones: number;
  achievedCount: number;
}

// Badge Progress Types
export interface BadgeProgress {
  badge: Badge;
  isEarned: boolean;
  progress: number;
  isEligible: boolean;
  earnedAt: Date | null;
}

export interface BadgeProgressData {
  badgeProgress: BadgeProgress[];
  currentStreak: number;
  totalBadges: number;
  earnedBadges: number;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  projectId?: string;
  badgeId?: string;
  type: 'reminder' | 'achievement' | 'celebration' | 'streak-break' | 'motivation' | 'warning';
  message: string;
  title: string;
  createdAt: Date;
  isRead: boolean;
}

// Progress History Types
export interface ProgressHistory {
  progress: DailyProgress[];
  total: number;
  hasMore: boolean;
}

// Today Status Types
export interface TodayStatus {
  hasPostedToday: boolean;
  todayPost: DailyProgress | null;
  currentStreak: number;
  nextStreakDay: number | null;
  totalStreakDays: number;
}

// Can Post Today Types
export interface CanPostToday {
  canPost: boolean;
  reason?: string;
  nextStreakDay?: number;
  targetDate?: Date;
  todayPost?: DailyProgress;
}

// User Types (from existing auth system)
export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Project List Response
export interface ProjectListResponse {
  success: boolean;
  projects: Project[];
  count: number;
}

// Category List Response
export interface CategoryListResponse {
  success: boolean;
  categories: Category[];
  count: number;
}

// Badge List Response
export interface BadgeListResponse {
  success: boolean;
  userBadges: UserBadge[];
  count: number;
}

// Notification List Response
export interface NotificationListResponse {
  success: boolean;
  notifications: Notification[];
  count: number;
  hasMore: boolean;
}

// Streak Challenge Extension Types
export interface ExtendStreakInput {
  projectId: string;
  additionalDays: number;
}

// Badge Eligibility Types
export interface BadgeEligibility {
  eligibleBadges: Badge[];
  currentStreak: number;
  earnedBadges: string[];
}

// Badge Leaderboard Types
export interface BadgeLeaderboardEntry {
  userId: string;
  user?: {
    id: string;
    name: string;
    image?: string;
  };
  badgeCount: number;
}

export interface BadgeLeaderboardResponse {
  success: boolean;
  leaderboard: BadgeLeaderboardEntry[];
}

// Enums
export const STREAK_GOAL_OPTIONS = [
  { value: 7, label: "7 days" },
  { value: 14, label: "14 days" },
  { value: 30, label: "30 days" },
  { value: 60, label: "60 days" },
  { value: 100, label: "100 days" },
  { value: 0, label: "Custom" },
] as const;

export type StreakGoalOption = typeof STREAK_GOAL_OPTIONS[number]['value'];

export const NOTIFICATION_TYPES = {
  REMINDER: 'reminder',
  ACHIEVEMENT: 'achievement',
  CELEBRATION: 'celebration',
  STREAK_BREAK: 'streak-break',
  MOTIVATION: 'motivation',
  WARNING: 'warning',
} as const;

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];
