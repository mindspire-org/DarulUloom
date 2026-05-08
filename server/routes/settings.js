import express from 'express';
import Setting from '../models/Setting.js';
import { protect, authorize } from '../middleware/auth.js';

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
router.get('/', protect, authorize('admin'), async (req, res) => {
    try {
        const settings = await getOrCreateSettings();
        res.json({ success: true, data: settings });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT /api/settings
// @desc    Update system settings
// @access  Private (admin)
router.put('/', protect, authorize('admin'), async (req, res) => {
    try {
        const settings = await getOrCreateSettings();

        const { notifications, appearance } = req.body;
        if (notifications && typeof notifications === 'object') {
            const currentNotifications =
                settings.notifications && typeof settings.notifications.toObject === 'function'
                    ? settings.notifications.toObject()
                    : (settings.notifications || {});
            settings.notifications = { ...currentNotifications, ...notifications };
        }
        if (appearance && typeof appearance === 'object') {
            const currentAppearance =
                settings.appearance && typeof settings.appearance.toObject === 'function'
                    ? settings.appearance.toObject()
                    : (settings.appearance || {});
            settings.appearance = { ...currentAppearance, ...appearance };
        }

        await settings.save();
        res.json({ success: true, data: settings });
    } catch (error) {
        console.error(error);
        res.status(400).json({ success: false, message: error.message });
    }
});

export default router;
