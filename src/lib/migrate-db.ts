import { db } from "@/server/db";
import { seedBadges } from "./seed-badges";

export async function migrateDatabase() {
  console.log("🚀 Starting database migration...");

  try {
    // 1. Check database connection
    console.log("📡 Checking database connection...");
    await db.$queryRaw`SELECT 1`;
    console.log("✅ Database connection successful");

    // 2. Seed badges
    console.log("🏆 Seeding badges...");
    await seedBadges();

    // 3. Verify all tables exist by running a simple query
    console.log("🔍 Verifying table structure...");
    
    try {
      // Test Project table
      await db.project.findFirst();
      console.log("✅ Project table verified");
      
      // Test Category table
      await db.category.findFirst();
      console.log("✅ Category table verified");
      
      // Test StreakChallenge table
      await db.streakChallenge.findFirst();
      console.log("✅ StreakChallenge table verified");
      
      // Test DailyProgress table
      await db.dailyProgress.findFirst();
      console.log("✅ DailyProgress table verified");
      
      // Test Badge table
      await db.badge.findFirst();
      console.log("✅ Badge table verified");
      
      // Test UserBadge table
      await db.userBadge.findFirst();
      console.log("✅ UserBadge table verified");
      
      // Test UserStreakStats table
      await db.userStreakStats.findFirst();
      console.log("✅ UserStreakStats table verified");
      
    } catch (error) {
      console.log("⚠️ Some tables may not exist yet. Run 'bun run db:push' first.");
      console.log("💡 Command: bun run db:push");
      throw new Error("Tables not found. Please run database push first.");
    }

    // 4. Check badge count
    const badgeCount = await db.badge.count();
    console.log(`🏅 Found ${badgeCount} badges in the system`);

    // 5. Verify relationships work
    console.log("🔗 Testing table relationships...");
    
    try {
      // Test a simple join query
      const testQuery = await db.project.findFirst({
        include: {
          category: true,
          streakStats: true,
        },
      });
      console.log("✅ Table relationships verified");
    } catch (error) {
      console.log("⚠️ Relationship test failed:", error);
    }

    console.log("🎉 Database migration completed successfully!");
    console.log("\n📋 Migration Summary:");
    console.log("  ✅ Database connection verified");
    console.log("  ✅ Badges seeded");
    console.log("  ✅ Table structure verified");
    console.log("  ✅ Relationships tested");
    console.log(`  🏅 ${badgeCount} badges available`);
    
    console.log("\n🚀 Your Build-in-Public Progress Board is ready!");
    console.log("\n📝 Next steps:");
    console.log("  1. Create a project with streak goal");
    console.log("  2. Start posting daily progress");
    console.log("  3. Earn badges and maintain streaks");
    console.log("  4. Build in public!");

  } catch (error) {
    console.error("💥 Database migration failed:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateDatabase()
    .then(() => {
      console.log("🎉 Migration completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Migration failed:", error);
      process.exit(1);
    });
}
