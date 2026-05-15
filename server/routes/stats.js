import express from 'express';
import Student from '../models/Student.js';
import Token from '../models/Token.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/stats
// @desc    Get dashboard statistics
// @access  Private (admin)
router.get('/', protect, authorize('admin'), async (req, res) => {
    try {
        // Get counts from both Token and Student
        const [studentTotal, studentPending, studentVerified, studentRejected, tokenTotal, tokenPending, tokenVerified, tokenRejected] = await Promise.all([
            Student.countDocuments(),
            Student.countDocuments({ status: 'pending' }),
            Student.countDocuments({ status: 'verified' }),
            Student.countDocuments({ status: 'rejected' }),
            Token.countDocuments(),
            Token.countDocuments({ status: 'pending' }),
            Token.countDocuments({ status: 'verified' }),
            Token.countDocuments({ status: 'rejected' }),
        ]);

        // Combine counts (use whichever has more, or sum unique by tokenNumber?)
        // For simplicity, we'll take unique tokenNumbers from both to avoid double-counting
        const [uniqueStudentTokens, uniqueTokenTokens] = await Promise.all([
            Student.distinct('tokenNumber'),
            Token.distinct('tokenNumber')
        ]);
        const allUniqueTokens = new Set([...uniqueStudentTokens, ...uniqueTokenTokens]);
        const total = allUniqueTokens.size;

        // For status counts, prioritize Student (since it's Counter 2's processed record)
        const pending = studentPending > 0 ? studentPending : tokenPending;
        const verified = studentVerified;
        const rejected = studentRejected;

        // Class distribution (from Student)
        const classDistribution = await Student.aggregate([
            { $group: { _id: '$class', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
        ]);

        // Category distribution (from Student)
        const categoryDistribution = await Student.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
        ]);

        // Recent students (from both, sorted by createdAt)
        const recentStudents = await Student.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .select('tokenNumber studentName fatherName class status createdAt')
            .populate('createdBy', 'name');
        
        // If no student records, check Token records
        let finalRecentStudents = recentStudents;
        if (finalRecentStudents.length === 0) {
            finalRecentStudents = await Token.find()
                .sort({ createdAt: -1 })
                .limit(10)
                .select('tokenNumber studentName fatherName class status createdAt')
                .populate('createdBy', 'name');
        }

        // Daily stats (last 7 days, from both)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const studentDailyStats = await Student.aggregate([
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

        const tokenDailyStats = await Token.aggregate([
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

        // Merge daily stats
        const dailyStatsMap = new Map();
        studentDailyStats.forEach(stat => dailyStatsMap.set(stat._id, (dailyStatsMap.get(stat._id) || 0) + stat.count));
        tokenDailyStats.forEach(stat => dailyStatsMap.set(stat._id, (dailyStatsMap.get(stat._id) || 0) + stat.count));
        const dailyStats = Array.from(dailyStatsMap.entries())
            .map(([_id, count]) => ({ _id, count }))
            .sort((a, b) => a._id.localeCompare(b._id));

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
                recentStudents: finalRecentStudents,
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
