import express from 'express';
import Student from '../models/Student.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

function escapeCsv(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (/[",\n]/.test(str)) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

function toCsv(rows, headers) {
    const headerLine = headers.map(escapeCsv).join(',');
    const lines = rows.map((r) => headers.map((h) => escapeCsv(r[h])).join(','));
    return [headerLine, ...lines].join('\n');
}

// @route   GET /api/reports
// @desc    Get available reports
// @access  Private (admin)
router.get('/', protect, authorize('admin'), async (req, res) => {
    res.json({
        success: true,
        data: [
            { id: 'admissions', title: 'داخلہ رپورٹ', description: 'تمام داخلوں کی تفصیلی رپورٹ', icon: 'FileText' },
            { id: 'students', title: 'طلباء کی رپورٹ', description: 'درجہ وار طلباء کی فہرست', icon: 'FileText' },
            { id: 'tokens', title: 'ٹوکن رپورٹ', description: 'جاری شدہ ٹوکنز کی رپورٹ', icon: 'FileText' },
            { id: 'monthly', title: 'ماہانہ رپورٹ', description: 'ماہانہ سرگرمیوں کا خلاصہ', icon: 'Calendar' },
        ],
    });
});

// @route   GET /api/reports/:type/download
// @desc    Download a CSV report
// @access  Private (admin)
router.get('/:type/download', protect, authorize('admin'), async (req, res) => {
    try {
        const { type } = req.params;

        if (type === 'monthly') {
            // Very simple monthly summary over current year
            const year = new Date().getFullYear();
            const start = new Date(`${year}-01-01T00:00:00.000Z`);
            const end = new Date(`${year + 1}-01-01T00:00:00.000Z`);

            const byMonth = await Student.aggregate([
                { $match: { createdAt: { $gte: start, $lt: end } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                        total: { $sum: 1 },
                        pending: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'pending'] }, 1, 0],
                            },
                        },
                        verified: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'verified'] }, 1, 0],
                            },
                        },
                        rejected: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0],
                            },
                        },
                    },
                },
                { $sort: { _id: 1 } },
            ]);

            const csv = toCsv(
                byMonth.map((m) => ({
                    month: m._id,
                    total: m.total,
                    pending: m.pending,
                    verified: m.verified,
                    rejected: m.rejected,
                })),
                ['month', 'total', 'pending', 'verified', 'rejected']
            );

            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="monthly-report-${year}.csv"`);
            return res.send(csv);
        }

        let query = {};
        if (type === 'admissions') query = { status: 'verified' };
        if (type === 'students') query = {};
        if (type === 'tokens') query = {};

        if (!['admissions', 'students', 'tokens'].includes(type)) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }

        const docs = await Student.find(query)
            .sort({ createdAt: -1 })
            .select('tokenNumber admissionNumber studentName fatherName cnic contact class category status createdAt verifiedAt');

        const rows = docs.map((d) => ({
            tokenNumber: d.tokenNumber,
            admissionNumber: d.admissionNumber || '',
            studentName: d.studentName,
            fatherName: d.fatherName,
            cnic: d.cnic,
            contact: d.contact,
            class: d.class,
            category: d.category,
            status: d.status,
            createdAt: d.createdAt?.toISOString?.() ?? '',
            verifiedAt: d.verifiedAt?.toISOString?.() ?? '',
        }));

        const csv = toCsv(rows, [
            'tokenNumber',
            'admissionNumber',
            'studentName',
            'fatherName',
            'cnic',
            'contact',
            'class',
            'category',
            'status',
            'createdAt',
            'verifiedAt',
        ]);

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${type}-report.csv"`);
        res.send(csv);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

export default router;
