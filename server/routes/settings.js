import express from "express";
import Setting from "../models/Setting.js";
import User from "../models/User.js";
import Student from "../models/Student.js";
import Token from "../models/Token.js";
import Grade from "../models/Grade.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Ensure one settings document exists
async function getOrCreateSettings() {
  const existing = await Setting.findOne();
  if (existing) return existing;
  return await Setting.create({});
}

// @route   GET /api/settings
// @desc    Get system settings
// @access  Private (admin)
router.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// @route   PUT /api/settings
// @desc    Update system settings
// @access  Private (admin)
router.put("/", protect, authorize("admin"), async (req, res) => {
  try {
    const settings = await getOrCreateSettings();

    const { notifications, appearance } = req.body;
    if (notifications && typeof notifications === "object") {
      const currentNotifications =
        settings.notifications &&
        typeof settings.notifications.toObject === "function"
          ? settings.notifications.toObject()
          : settings.notifications || {};
      settings.notifications = { ...currentNotifications, ...notifications };
    }
    if (appearance && typeof appearance === "object") {
      const currentAppearance =
        settings.appearance &&
        typeof settings.appearance.toObject === "function"
          ? settings.appearance.toObject()
          : settings.appearance || {};
      settings.appearance = { ...currentAppearance, ...appearance };
    }

    await settings.save();
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// @route   POST /api/settings/backup
// @desc    Backup all database collections
// @access  Private (admin)
router.post("/backup", protect, authorize("admin"), async (req, res) => {
  try {
    const backup = {
      timestamp: new Date().toISOString(),
      users: await User.find().lean(),
      students: await Student.find().lean(),
      tokens: await Token.find().lean(),
      grades: await Grade.find().lean(),
      settings: await Setting.find().lean(),
    };

    const filename = `jamia-backup-${new Date().toISOString().split("T")[0]}.json`;

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.json(backup);
  } catch (error) {
    console.error("Backup error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to create backup" });
  }
});

// @route   POST /api/settings/restore
// @desc    Restore database from backup
// @access  Private (admin)
router.post("/restore", protect, authorize("admin"), async (req, res) => {
  try {
    const backup = req.body;

    if (!backup || typeof backup !== "object") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid backup data" });
    }

    // Delete existing data
    await User.deleteMany({});
    await Student.deleteMany({});
    await Token.deleteMany({});
    await Grade.deleteMany({});
    await Setting.deleteMany({});

    // Restore all data
    if (backup.users?.length) await User.insertMany(backup.users);
    if (backup.students?.length) await Student.insertMany(backup.students);
    if (backup.tokens?.length) await Token.insertMany(backup.tokens);
    if (backup.grades?.length) await Grade.insertMany(backup.grades);
    if (backup.settings?.length) await Setting.insertMany(backup.settings);

    res.json({ success: true, message: "Database restored successfully" });
  } catch (error) {
    console.error("Restore error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to restore database" });
  }
});

// @route   DELETE /api/settings/delete-all
// @desc    Delete all data from database EXCEPT users
// @access  Private (admin)
router.delete("/delete-all", protect, authorize("admin"), async (req, res) => {
  try {
    await Student.deleteMany({});
    await Token.deleteMany({});
    await Grade.deleteMany({});
    await Setting.deleteMany({});

    res.json({
      success: true,
      message: "All data deleted successfully (users preserved)",
    });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ success: false, message: "Failed to delete data" });
  }
});

export default router;
