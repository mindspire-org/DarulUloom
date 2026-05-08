import express from 'express';
import Grade from '../models/Grade.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/grades
// @desc    Get all grades
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const { type } = req.query;

        let query = { isActive: true };
        if (type) query.type = type;

        const grades = await Grade.find(query).sort({ type: 1, name: 1 });

        res.json({
            success: true,
            count: grades.length,
            data: grades,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/grades
// @desc    Create new grade
// @access  Private (admin)
router.post('/', protect, authorize('admin'), async (req, res) => {
    try {
        const grade = await Grade.create(req.body);

        res.status(201).json({
            success: true,
            data: grade,
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// @route   PUT /api/grades/:id
// @desc    Update grade
// @access  Private (admin)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const grade = await Grade.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!grade) {
            return res.status(404).json({
                success: false,
                message: 'Grade not found'
            });
        }

        res.json({
            success: true,
            data: grade,
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// @route   DELETE /api/grades/:id
// @desc    Delete grade
// @access  Private (admin)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const grade = await Grade.findByIdAndDelete(req.params.id);

        if (!grade) {
            return res.status(404).json({
                success: false,
                message: 'Grade not found'
            });
        }

        res.json({
            success: true,
            message: 'Grade deleted successfully',
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
