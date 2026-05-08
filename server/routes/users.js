import express from 'express';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.put('/me', protect, async (req, res) => {
    try {
        const { name, username } = req.body;

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (typeof name === 'string') {
            const n = name.trim();
            if (n) user.name = n;
        }

        if (typeof username === 'string') {
            const u = username.trim().toLowerCase();
            if (u && u !== user.username) {
                const exists = await User.findOne({ username: u });
                if (exists) {
                    return res.status(400).json({
                        success: false,
                        message: 'Username already exists'
                    });
                }
                user.username = u;
            }
        }

        await user.save();

        res.json({
            success: true,
            data: {
                id: user._id,
                username: user.username,
                name: user.name,
                role: user.role,
                isActive: user.isActive,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

router.put('/me/password', protect, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide currentPassword and newPassword'
            });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const ok = await user.matchPassword(currentPassword);
        if (!ok) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password updated successfully',
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// @route   GET /api/users
// @desc    Get all users
// @access  Private (admin)
router.get('/', protect, authorize('admin'), async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });

        res.json({
            success: true,
            count: users.length,
            data: users,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/users
// @desc    Create new user
// @access  Private (admin)
router.post('/', protect, authorize('admin'), async (req, res) => {
    try {
        const { username, password, name, role, assignedClasses } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ username: username.toLowerCase() });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'Username already exists'
            });
        }

        const user = await User.create({
            username: username.toLowerCase(),
            password,
            name: name.trim(),
            role,
            assignedClasses: role === 'counter2' ? (Array.isArray(assignedClasses) ? assignedClasses : []) : undefined,
        });

        res.status(201).json({
            success: true,
            data: {
                id: user._id,
                username: user.username,
                name: user.name,
                role: user.role,
                assignedClasses: user.assignedClasses,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (admin)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const { password, ...updateData } = req.body;

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update fields
        Object.assign(user, updateData);

        // Update password if provided
        if (password) {
            user.password = password;
        }

        // Handle assignedClasses for counter2
        if (req.body.role === 'counter2') {
            user.assignedClasses = Array.isArray(req.body.assignedClasses) ? req.body.assignedClasses : [];
        } else if (req.body.role && req.body.role !== 'counter2') {
            user.assignedClasses = undefined;
        }

        await user.save();

        res.json({
            success: true,
            data: {
                id: user._id,
                username: user.username,
                name: user.name,
                role: user.role,
                isActive: user.isActive,
                assignedClasses: user.assignedClasses,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private (admin)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent deleting admin
        if (user.role === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Cannot delete admin user'
            });
        }

        await user.deleteOne();

        res.json({
            success: true,
            message: 'User deleted successfully',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

export default router;
