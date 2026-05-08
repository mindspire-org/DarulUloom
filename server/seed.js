import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import Grade from "./models/Grade.js";

dotenv.config();

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "123456";
const ADMIN_NAME = "Admin";

async function seedAdmin() {
  const username = ADMIN_USERNAME.toLowerCase();

  const existing = await User.findOne({ username });
  if (existing) {
    existing.name = ADMIN_NAME;
    existing.role = "admin";
    existing.isActive = true;
    existing.password = ADMIN_PASSWORD;
    await existing.save();

    // eslint-disable-next-line no-console
    console.log(`✅ Admin user updated: ${username}`);
    return;
  }

  await User.create({
    username,
    password: ADMIN_PASSWORD,
    name: ADMIN_NAME,
    role: "admin",
    isActive: true,
  });

  // eslint-disable-next-line no-console
  console.log(`✅ Admin user created: ${username}`);
}

const DEFAULT_GRADES = [
  // Dars-e-Nizami (Based on image: Exam 2026-04-01/03-31, Result 2026-04-02)
  { name: "اولیٰ", type: "Dars-e-Nizami", capacity: 50, testDate: "2026-04-01", resultDate: "2026-04-02" },
  { name: "ثانیہ", type: "Dars-e-Nizami", capacity: 50, testDate: "2026-04-01", resultDate: "2026-04-02" },
  { name: "ثالثہ", type: "Dars-e-Nizami", capacity: 50, testDate: "2026-04-01", resultDate: "2026-04-02" },
  { name: "رابعہ", type: "Dars-e-Nizami", capacity: 50, testDate: "2026-04-01", resultDate: "2026-04-02" },
  { name: "خامسہ", type: "Dars-e-Nizami", capacity: 50, testDate: "2026-04-01", resultDate: "2026-04-02" },
  { name: "سادسہ", type: "Dars-e-Nizami", capacity: 50, testDate: "2026-03-31", resultDate: "2026-04-02" },
  { name: "سابعہ", type: "Dars-e-Nizami", capacity: 50, testDate: "2026-03-31", resultDate: "2026-04-02" },
  { name: "دورہ حدیث", type: "Dars-e-Nizami", capacity: 50, testDate: "2026-03-31", resultDate: "2026-04-02" },

  // Ma'had (Based on image: Exam 2026-04-01, Result 2026-04-02)
  { name: "تمہیدی", type: "Ma'had", capacity: 50, testDate: "2026-04-01", resultDate: "2026-04-02" },
  { name: "معہد سال اول", type: "Ma'had", capacity: 50, testDate: "2026-04-01", resultDate: "2026-04-02" },
  { name: "معہد سال دوم", type: "Ma'had", capacity: 50, testDate: "2026-04-01", resultDate: "2026-04-02" },
  { name: "معہد سال سوم", type: "Ma'had", capacity: 50, testDate: "2026-04-01", resultDate: "2026-04-02" },
];

async function seedGrades() {
  let created = 0;
  for (const g of DEFAULT_GRADES) {
    const existing = await Grade.findOne({ name: g.name, type: g.type });
    if (!existing) {
      await Grade.create({
        ...g,
        capacity: typeof g.capacity === "number" ? g.capacity : 50,
        currentCount: 0,
        isActive: true,
        ...(g.testDate ? { testDate: new Date(g.testDate) } : {}),
        ...(g.resultDate ? { resultDate: new Date(g.resultDate) } : {}),
      });
      created++;
    } else if (process.env.FORCE_SEED_GRADES === "true") {
      existing.isActive = true;
      existing.capacity = typeof g.capacity === "number" ? g.capacity : (existing.capacity || 50);
      if (g.testDate) existing.testDate = new Date(g.testDate);
      if (g.resultDate) existing.resultDate = new Date(g.resultDate);
      await existing.save();
    }
  }
  // eslint-disable-next-line no-console
  console.log(`✅ Grades seed completed${created ? ` (${created} created)` : ""}`);
}

(async () => {
  try {
    await connectDB();
    await seedAdmin();
    await seedGrades();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("❌ Seed failed:", err);
    process.exitCode = 1;
  } finally {
    try {
      await mongoose.disconnect();
    } catch {
    }
  }
})();
