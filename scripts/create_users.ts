#!/usr/bin/env node
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../server/config/db.js";
import User from "../server/models/User.js";

dotenv.config();

/**
 * Define users to create here.
 * Duplicate check is done by username (case-insensitive).
 */
const USERS_TO_CREATE = [
  {
    username: "admin",
    password: "admin321",
    name: "Admin",
    role: "admin" as const,
    isActive: true,
  },
  {
    username: "counter1",
    password: "counter321",
    name: "Counter 1 User",
    role: "counter1" as const,
    isActive: true,
  },
  {
    username: "counter2",
    password: "counter321",
    name: "Counter 2 User",
    role: "counter2" as const,
    isActive: true,
  },
  // Add more users as needed
];

async function createUsers() {
  const results = {
    created: 0,
    skipped: 0,
    errors: 0,
    details: [] as string[],
  };

  for (const userData of USERS_TO_CREATE) {
    try {
      const username = userData.username.toLowerCase();

      // Check if user already exists (duplicate prevention)
      const existing = await User.findOne({ username });

      if (existing) {
        console.log(`⚠️  Skipped (already exists): ${username}`);
        results.skipped++;
        results.details.push(`SKIPPED: ${username} - already exists`);
        continue;
      }

      // Create new user
      await User.create({
        ...userData,
        username,
      });

      console.log(`✅ Created: ${username} (${userData.role})`);
      results.created++;
      results.details.push(`CREATED: ${username} (${userData.role})`);
    } catch (error: any) {
      console.error(`❌ Error creating ${userData.username}:`, error.message);
      results.errors++;
      results.details.push(`ERROR: ${userData.username} - ${error.message}`);
    }
  }

  return results;
}

async function main() {
  console.log("🚀 Starting user creation script...\n");

  try {
    // Connect to database
    await connectDB();
    console.log("");

    // Create users
    const results = await createUsers();

    // Summary
    console.log("\n📊 Summary:");
    console.log(`   ✅ Created: ${results.created}`);
    console.log(`   ⚠️  Skipped: ${results.skipped}`);
    console.log(`   ❌ Errors:  ${results.errors}`);
    console.log("\n✨ User creation script completed.");

    // Exit with appropriate code
    process.exitCode = results.errors > 0 ? 1 : 0;
  } catch (error: any) {
    console.error("\n❌ Fatal error:", error.message);
    process.exitCode = 1;
  } finally {
    // Disconnect from database
    try {
      await mongoose.disconnect();
      console.log("📴 Disconnected from database.");
    } catch {
      // Ignore disconnect errors
    }
  }
}

main();
