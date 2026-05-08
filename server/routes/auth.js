import express from 'express';
import User from '../models/User.js';
import { generateToken, protect } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/auth/login
// @desc    Login user & get token
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({ message: 'Please provide username and password' });
        }

        // Find user
        const user = await User.findOne({ username: username.toLowerCase() });

        if (!user) {
            return res.status(401).json({ message: 'صارف موجود نہیں' });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({ message: 'صارف فعال نہیں ہے' });
        }

        // Check password
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ message: 'پاس ورڈ درست نہیں' });
        }

        // Generate token
        if (!process.env.JWT_SECRET) {
            console.error('❌ JWT_SECRET is missing in environment variables');
            return res.status(500).json({ message: 'Server configuration error: JWT_SECRET is missing' });
        }
        const token = generateToken(user._id);

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                name: user.name,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: process.env.NODE_ENV === 'development' ? error.message : undefined 
        });
    }
});

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', protect, async (req, res) => {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
});

export default router;
