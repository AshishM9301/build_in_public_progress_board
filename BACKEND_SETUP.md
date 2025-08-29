# 🚀 Build-in-Public Progress Board - Backend Setup

## 📋 Overview

This document describes the complete backend implementation for the Build-in-Public Progress Board system. The backend provides a robust API for managing projects, streak challenges, daily progress, badges, and notifications.

## 🗄️ Database Schema

### Core Tables

#### 1. **Project Table**
- **Purpose**: Stores project information and streak challenge settings
- **Key Fields**: `name`, `description`, `categoryId`, `targetStreakDays`, `startDate`, `endDate`
- **Relationships**: Links to Category, User, StreakChallenge, DailyProgress, UserStreakStats

#### 2. **Category Table**
- **Purpose**: User-defined project categories
- **Key Fields**: `name`, `userId`
- **Relationships**: Links to User and Projects

#### 3. **StreakChallenge Table**
- **Purpose**: Individual streak day records for each project
- **Key Fields**: `dayNumber`, `targetDate`, `isPosted`, `isCompleted`
- **Relationships**: Links to Project, User, and DailyProgress

#### 4. **DailyProgress Table**
- **Purpose**: User's daily progress posts
- **Key Fields**: `content`, `streakDayId`
- **Relationships**: Links to Project, StreakChallenge, and User

#### 5. **Badge Table**
- **Purpose**: Predefined badges with criteria
- **Key Fields**: `name`, `description`, `icon`, `criteria`
- **Relationships**: Links to UserBadge

#### 6. **UserBadge Table**
- **Purpose**: Badges earned by users
- **Key Fields**: `userId`, `badgeId`, `projectId`, `earnedAt`
- **Relationships**: Links to User, Badge, and Project

#### 7. **UserStreakStats Table**
- **Purpose**: Tracks user's streak statistics
- **Key Fields**: `currentStreak`, `longestStreak`, `totalPosts`, `challengesCompleted`
- **Relationships**: Links to User and Project

## 🔌 API Endpoints

### Project Router (`/api/trpc/project.*`)

#### **Create Project**
```typescript
POST /api/trpc/project.create
Body: {
  name: string,
  description?: string,
  categoryId: string,
  targetStreakDays: number
}
```
- Creates project with specified streak goal
- Auto-generates streak day records
- Creates initial streak statistics

#### **Get User Projects**
```typescript
GET /api/trpc/project.getUserProjects
```
- Returns all active projects for authenticated user
- Includes category, streak stats, and counts

#### **Get Project Details**
```typescript
GET /api/trpc/project.getProject
Params: { id: string }
```
- Returns detailed project information
- Includes streak challenges and progress history

#### **Update Project**
```typescript
PUT /api/trpc/project.update
Body: { id: string, ...updateData }
```
- Updates project details
- Validates user ownership

#### **Delete Project**
```typescript
DELETE /api/trpc/project.delete
Params: { id: string }
```
- Soft deletes project (sets `isActive: false`)

#### **Extend Streak Challenge**
```typescript
POST /api/trpc/project.extendStreak
Body: { projectId: string, additionalDays: number }
```
- Extends existing streak challenge
- Generates additional streak day records

### Category Router (`/api/trpc/category.*`)

#### **Create Category**
```typescript
POST /api/trpc/category.create
Body: { name: string }
```
- Creates user-defined category
- Prevents duplicate names per user

#### **Get User Categories**
```typescript
GET /api/trpc/category.getUserCategories
```
- Returns all categories for authenticated user
- Includes project counts

#### **Update Category**
```typescript
PUT /api/trpc/category.update
Body: { id: string, name: string }
```
- Updates category name
- Validates no conflicts

#### **Delete Category**
```typescript
DELETE /api/trpc/category.delete
Params: { id: string }
```
- Deletes category if no projects use it

### Progress Router (`/api/trpc/progress.*`)

#### **Create Daily Post**
```typescript
POST /api/trpc/progress.createDailyPost
Body: { projectId: string, content: string }
```
- Creates daily progress post
- Links to current streak day
- Updates streak statistics
- Checks badge eligibility
- **Daily Post Limit**: Users can post up to `MAX_POSTS_PER_DAY` times per day (configurable via environment variable, default: 5)

#### **Get Progress History**
```typescript
GET /api/trpc/progress.getProgressHistory
Params: { projectId: string, limit?: number, offset?: number }
```
- Returns paginated progress history
- Includes streak day information

#### **Get Today's Status**
```typescript
GET /api/trpc/progress.getTodayStatus
Params: { projectId: string }
```
- Checks if user posted today
- Returns current streak status

#### **Get Streak Calendar**
```typescript
GET /api/trpc/progress.getStreakCalendar
Params: { projectId: string }
```
- Returns calendar view of streak days
- Shows posted/missed status

### Badge Router (`/api/trpc/badge.*`)

#### **Get All Badges**
```typescript
GET /api/trpc/badge.getAllBadges
```
- Returns all available badges
- Ordered by criteria (ascending)

#### **Get User Badges**
```typescript
GET /api/trpc/badge.getUserBadges
```
- Returns badges earned by user
- Includes project information

#### **Check Badge Eligibility**
```typescript
GET /api/trpc/badge.checkBadgeEligibility
Params: { projectId: string }
```
- Checks if user qualifies for new badges
- Based on current streak

#### **Award Badge**
```typescript
POST /api/trpc/badge.awardBadge
Body: { badgeId: string, projectId: string }
```
- Awards badge to user
- Prevents duplicate awards

### Streak Router (`/api/trpc/streak.*`)

#### **Get Streak Progress**
```typescript
GET /api/trpc/streak.getStreakProgress
Params: { projectId: string }
```
- Returns current streak status
- Includes progress percentage

#### **Check Streak Status**
```typescript
GET /api/trpc/streak.checkStreakStatus
Params: { projectId: string }
```
- Checks if streak is broken
- Identifies missed days

#### **Reset Streak Challenge**
```typescript
POST /api/trpc/streak.resetStreak
Body: { projectId: string }
```
- Resets streak challenge to Day 1
- Updates all dates and statistics

#### **Get Streak Calendar**
```typescript
GET /api/trpc/streak.getStreakCalendar
Params: { projectId: string }
```
- Returns weekly calendar view
- Shows streak day status

### Notification Router (`/api/trpc/notification.*`)

#### **Send Streak Reminder**
```typescript
POST /api/trpc/notification.sendStreakReminder
Body: { projectId: string }
```
- Sends daily reminder notification
- Context-aware messaging

#### **Send Badge Notification**
```typescript
POST /api/trpc/notification.sendBadgeNotification
Body: { badgeId: string, projectId: string }
```
- Sends badge earned celebration
- Includes badge and project details

#### **Send Challenge Complete**
```typescript
POST /api/trpc/notification.sendChallengeComplete
Body: { projectId: string }
```
- Sends challenge completion celebration
- Motivates next challenge

## 🚀 Setup Instructions

### 1. **Database Setup**
```bash
# Push schema to database
bun run db:push

# Seed initial badges
bun run db:seed

# Run full migration (optional)
bun run db:migrate-full
```

### 2. **Environment Variables**
Ensure your `.env` file contains:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
```

### 3. **Database Commands**
```bash
# Generate Prisma client
bun run db:generate

# Open Prisma Studio
bun run db:studio

# Reset database (careful!)
bun run db:reset
```

## 🔐 Authentication & Security

- All endpoints use `privateProcedure` requiring authentication
- User ownership validation on all operations
- Input validation using Zod schemas
- SQL injection protection via Prisma ORM

## 📊 Data Flow

### **Project Creation Flow**
1. User creates project with streak goal
2. System generates streak day records
3. Initial streak statistics created
4. Project ready for daily posting

### **Daily Posting Flow**
1. User writes progress update
2. System links to current streak day
3. Streak statistics updated
4. Badge eligibility checked
5. Notifications sent if applicable

### **Streak Management Flow**
1. System tracks daily posting
2. Detects missed days
3. Updates streak counters
4. Sends appropriate notifications
5. Manages challenge completion

## 🏆 Badge System

### **Badge Criteria**
- **First Steps**: 1 day
- **Getting Started**: 3 days
- **Week Warrior**: 7 days
- **Fortnight Fighter**: 14 days
- **Monthly Master**: 30 days
- **Quarterly Champion**: 60 days
- **Century Legend**: 100 days
- **Consistency King**: 150 days
- **Half Year Hero**: 180 days
- **Year Warrior**: 365 days

### **Badge Award Process**
1. User reaches badge criteria
2. System checks eligibility
3. Badge automatically awarded
4. Notification sent
5. Badge displayed on dashboard

## 🔄 Streak Logic

### **Streak Rules**
- **Daily Requirement**: One post per day
- **Consecutive Days**: Must post every day
- **Streak Break**: Missing a day breaks the streak
- **Recovery**: Only option is to start challenge again

### **Streak Calculation**
- Counts consecutive completed days
- Tracks longest streak achieved
- Calculates progress percentage
- Identifies missed days

## 📱 Notification System

### **Notification Types**
- **Reminder**: Daily posting reminders
- **Achievement**: Badge earned
- **Celebration**: Challenge completed
- **Streak Break**: Streak broken
- **Motivation**: Progress-based encouragement

### **Smart Messaging**
- Context-aware content
- Progress-based motivation
- Streak status awareness
- Personalized encouragement

## ⚙️ Configuration

### **Environment Variables**
```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# Authentication
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
TWITTER_CLIENT_ID="your_twitter_client_id"
TWITTER_CLIENT_SECRET="your_twitter_client_secret"

# S3 Configuration
AWS_ACCESS_KEY_ID="your_aws_access_key"
AWS_SECRET_ACCESS_KEY="your_aws_secret_key"
AWS_REGION="your_aws_region"
AWS_S3_BUCKET="your_s3_bucket_name"

# Post Limits
MAX_POSTS_PER_DAY=5  # Maximum posts per day per user per project
```

### **Daily Post Limits**
- **Default Limit**: 5 posts per day per project
- **Configurable**: Set via `MAX_POSTS_PER_DAY` environment variable
- **Validation**: Applied in `canPostToday`, `validatePostingDate`, and `createDailyPost` endpoints
- **User Experience**: Prevents spam while allowing multiple daily updates

## 🧪 Testing
```bash
# Test project creation
curl -X POST /api/trpc/project.create \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Project","targetStreakDays":7}'

# Test progress posting
curl -X POST /api/trpc/progress.createDailyPost \
  -H "Content-Type: application/json" \
  -d '{"projectId":"project_id","content":"Test progress"}'
```

### **Database Testing**
```bash
# Check table structure
bun run db:studio

# Verify relationships
bun run db:migrate-full
```

## 🚨 Error Handling

### **Common Errors**
- **Project Not Found**: Invalid project ID
- **Unauthorized**: User doesn't own project
- **Streak Broken**: Missed posting day
- **Badge Already Earned**: Duplicate badge request

### **Error Responses**
```typescript
{
  success: false,
  error: "Error message",
  code?: "ERROR_CODE"
}
```

## 🔮 Future Enhancements

### **Planned Features**
- Real-time notifications via WebSocket
- Email notification system
- Social sharing integration
- Advanced analytics dashboard
- Team/community challenges
- Mobile app API

### **Scalability Considerations**
- Database indexing optimization
- Query performance monitoring
- Caching layer implementation
- Rate limiting for API endpoints
- Background job processing

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Zod Validation](https://zod.dev/)

## 🆘 Support

For backend issues or questions:
1. Check database connection
2. Verify Prisma schema
3. Review API endpoint logs
4. Test with Prisma Studio
5. Check authentication status

---

**🎉 Your Build-in-Public Progress Board backend is ready! Start creating projects and building streaks!**
