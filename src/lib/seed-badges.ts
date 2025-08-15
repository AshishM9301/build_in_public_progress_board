import { db } from "@/server/db";

const badges = [
  {
    name: "First Steps",
    description: "Completed your first day of posting",
    icon: "🌱",
    criteria: 1,
  },
  {
    name: "Getting Started",
    description: "Completed 3 consecutive days of posting",
    icon: "🚀",
    criteria: 3,
  },
  {
    name: "Week Warrior",
    description: "Completed 7 consecutive days of posting",
    icon: "💪",
    criteria: 7,
  },
  {
    name: "Fortnight Fighter",
    description: "Completed 14 consecutive days of posting",
    icon: "⚔️",
    criteria: 14,
  },
  {
    name: "Monthly Master",
    description: "Completed 30 consecutive days of posting",
    icon: "👑",
    criteria: 30,
  },
  {
    name: "Quarterly Champion",
    description: "Completed 60 consecutive days of posting",
    icon: "🏆",
    criteria: 60,
  },
  {
    name: "Century Legend",
    description: "Completed 100 consecutive days of posting",
    icon: "🌟",
    criteria: 100,
  },
  {
    name: "Consistency King",
    description: "Completed 150 consecutive days of posting",
    icon: "👑",
    criteria: 150,
  },
  {
    name: "Half Year Hero",
    description: "Completed 180 consecutive days of posting",
    icon: "🦸",
    criteria: 180,
  },
  {
    name: "Year Warrior",
    description: "Completed 365 consecutive days of posting",
    icon: "🗓️",
    criteria: 365,
  },
];

export async function seedBadges() {
  console.log("🌱 Seeding badges...");

  try {
    // Check if badges already exist
    const existingBadges = await db.badge.findMany();
    
    if (existingBadges.length > 0) {
      console.log("✅ Badges already exist, skipping seed");
      return;
    }

    // Create all badges
    const createdBadges = await db.badge.createMany({
      data: badges,
    });

    console.log(`✅ Created ${createdBadges.count} badges`);
    
    // Log created badges
    const allBadges = await db.badge.findMany({
      orderBy: { criteria: "asc" },
    });
    
    console.log("📋 Badges created:");
    allBadges.forEach(badge => {
      console.log(`  ${badge.icon} ${badge.name} (${badge.criteria} days)`);
    });

  } catch (error) {
    console.error("❌ Error seeding badges:", error);
    throw error;
  }
}

export async function clearBadges() {
  console.log("🗑️ Clearing badges...");
  
  try {
    // Delete all user badges first (due to foreign key constraints)
    await db.userBadge.deleteMany();
    
    // Delete all badges
    await db.badge.deleteMany();
    
    console.log("✅ All badges cleared");
  } catch (error) {
    console.error("❌ Error clearing badges:", error);
    throw error;
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seedBadges()
    .then(() => {
      console.log("🎉 Badge seeding completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Badge seeding failed:", error);
      process.exit(1);
    });
}
