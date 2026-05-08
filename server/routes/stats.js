import express from 'express';
import Student from '../models/Student.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/stats
// @desc    Get dashboard statistics
// @access  Private (admin)
router.get('/', protect, authorize('admin'), async (req, res) => {
    try {
        // Get counts
        const [total, pending, verified, rejected] = await Promise.all([
            Student.countDocuments(),
            Student.countDocuments({ status: 'pending' }),
            Student.countDocuments({ status: 'verified' }),
            Student.countDocuments({ status: 'rejected' }),
        ]);

        // Class distribution
        const classDistribution = await Student.aggregate([
            { $group: { _id: '$class', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
        ]);

        // Category distribution
        const categoryDistribution = await Student.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
        ]);

        // Recent students
        const recentStudents = await Student.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .select('tokenNumber studentName fatherName class status createdAt')
            .populate('createdBy', 'name');

        // Daily stats (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const dailyStats = await Student.aggregate([
            {
                $match: {
                    createdAt: { $gte: sevenDaysAgo },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                    },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        res.json({
            success: true,
            data: {
                overview: {
                    total,
                    pending,
                    verified,
                    rejected,
                },
                classDistribution,
                categoryDistribution,
                recentStudents,
                dailyStats,
            },
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
