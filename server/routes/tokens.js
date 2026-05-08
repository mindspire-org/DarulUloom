import express from 'express';
import Token from '../models/Token.js';
import Student from '../models/Student.js';
import Grade from '../models/Grade.js';
import { protect, authorize } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

const canManageOwnToken = (token, userId) => {
    if (!token) return false;
    if (!token.createdBy) return false;
    return String(token.createdBy) === String(userId);
};

// @route   POST /api/tokens
// @desc    Create new token (Counter 1)
// @access  Private (counter1)
router.post('/', protect, authorize('counter1'), upload.single('photo'), async (req, res) => {
    try {
        // Fetch class dates if class is provided
        let classDates = {};
        if (req.body.class) {
            const grade = await Grade.findOne({ name: req.body.class });
            if (grade) {
                classDates = {
                    testDate: grade.testDate,
                    resultDate: grade.resultDate
                };
            }
        }

        const tokenData = {
            ...req.body,
            ...classDates,
            photoUrl: req.file ? `/uploads/photos/${req.file.filename}` : null,
            createdBy: req.user._id,
        };

        const token = await Token.create(tokenData);

        res.status(201).json({
            success: true,
            data: token,
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// @route   PUT /api/tokens/:id/form-data
// @desc    Save Counter 2 draft form data on token (pending)
// @access  Private (counter2)
router.put('/:id/form-data', protect, authorize('counter2'), async (req, res) => {
    try {
        const token = await Token.findById(req.params.id);
        if (!token) {
            return res.status(404).json({
                success: false,
                message: 'Token not found'
            });
        }

        if (token.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Token is not pending'
            });
        }

        const { formData } = req.body;
        token.formData = formData && typeof formData === 'object' ? formData : {};

        // Also sync top-level fields for consistency if they are in formData
        if (formData && typeof formData === 'object') {
            // Use undefined check instead of truthy check to allow empty strings
            if (formData.name !== undefined) token.studentName = formData.name;
            if (formData.fatherName !== undefined) token.fatherName = formData.fatherName;
            if (formData.dob !== undefined) token.dateOfBirth = formData.dob;
            if (formData.cnic !== undefined) token.cnic = formData.cnic;
            if (formData.passportNumber !== undefined) token.passportNumber = formData.passportNumber;
            if (formData.bformNumber !== undefined) token.bformNumber = formData.bformNumber;
            if (formData.idType !== undefined) token.idType = formData.idType;
            if (formData.phone !== undefined) token.contact = formData.phone;
            if (formData.desiredGrade !== undefined) token.class = formData.desiredGrade;
            if (formData.category !== undefined) token.category = formData.category;
            if (formData.statusType !== undefined) token.statusType = formData.statusType;
            if (formData.residency !== undefined) token.residency = formData.residency;
        }

        await token.save();

        res.json({
            success: true,
            data: token,
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// @route   GET /api/tokens/my
// @desc    Get tokens created by current Counter 1
// @access  Private (counter1)
router.get('/my', protect, authorize('counter1'), async (req, res) => {
    try {
        const tokens = await Token.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
        res.json({
            success: true,
            count: tokens.length,
            data: tokens,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/tokens/cnic/:cnic
// @desc    Get student/token by CNIC for auto-fill
// @access  Private (counter1)
router.get('/cnic/:cnic', protect, authorize('counter1'), async (req, res) => {
    try {
        const { cnic } = req.params;
        const cleanCnic = cnic.replace(/-/g, ''); // Remove dashes for comparison
        
        // Use regex to match CNIC with or without dashes
        const cnicRegex = new RegExp(`^${cleanCnic.split('').join('-?')}?$`);

        // 1. Search in Tokens first (most recent)
        let data = await Token.findOne({ 
            $or: [
                { cnic: cnic },
                { cnic: cleanCnic },
                { cnic: { $regex: cleanCnic.split('').join('-?') } }
            ]
        }).sort({ createdAt: -1 });
        
        // 2. If not found, search in Students
        if (!data) {
            data = await Student.findOne({ 
                $or: [
                    { cnic: cnic },
                    { cnic: cleanCnic },
                    { cnic: { $regex: cleanCnic.split('').join('-?') } }
                ]
            }).sort({ createdAt: -1 });
        }

        if (!data) {
            return res.status(404).json({
                success: false,
                message: 'No record found with this ID card'
            });
        }

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   PUT /api/tokens/my/:id
// @desc    Update own token (Counter 1)
// @access  Private (counter1)
router.put('/my/:id', protect, authorize('counter1'), upload.single('photo'), async (req, res) => {
    try {
        const token = await Token.findById(req.params.id);
        if (!token) {
            return res.status(404).json({
                success: false,
                message: 'Token not found'
            });
        }

        if (!canManageOwnToken(token, req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to manage this token'
            });
        }

        const allowed = [
            'studentName',
            'fatherName',
            'dateOfBirth',
            'age',
            'currentAddress',
            'permanentAddress',
            'cnic',
            'passportNumber',
            'bformNumber',
            'idType',
            'contact',
            'class',
            'category',
            'statusType',
            'residency',
        ];

        for (const key of allowed) {
            if (Object.prototype.hasOwnProperty.call(req.body, key)) {
                token[key] = req.body[key];
            }
        }

        if (req.file) {
            token.photoUrl = `/uploads/photos/${req.file.filename}`;
        }

        await token.save();

        res.json({
            success: true,
            data: token,
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// @route   DELETE /api/tokens/my/:id
// @desc    Delete own token (Counter 1)
// @access  Private (counter1)
router.delete('/my/:id', protect, authorize('counter1'), async (req, res) => {
    try {
        const token = await Token.findById(req.params.id);
        if (!token) {
            return res.status(404).json({
                success: false,
                message: 'Token not found'
            });
        }

        if (!canManageOwnToken(token, req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to manage this token'
            });
        }

        await token.deleteOne();

        res.json({
            success: true,
            message: 'Token deleted successfully',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/tokens/my/:id/regenerate-token
// @desc    Regenerate token number (Counter 1)
// @access  Private (counter1)
router.post('/my/:id/regenerate-token', protect, authorize('counter1'), async (req, res) => {
    try {
        const token = await Token.findById(req.params.id);
        if (!token) {
            return res.status(404).json({
                success: false,
                message: 'Token not found'
            });
        }

        if (!canManageOwnToken(token, req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to manage this token'
            });
        }

        token.tokenNumber = undefined;
        token.status = 'pending';
        token.verifiedBy = undefined;
        token.verifiedAt = undefined;

        await token.save();

        res.json({
            success: true,
            data: token,
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// @route   GET /api/tokens/pending
// @desc    Get pending tokens for Counter 2
// @access  Private (counter2, admin)
router.get('/pending', protect, authorize('counter2', 'admin'), async (req, res) => {
    try {
        const tokens = await Token.find({ status: 'pending' })
            .populate('createdBy', 'name username')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: tokens.length,
            data: tokens,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/tokens/token/:tokenNumber
// @desc    Get token by token number
// @access  Private (counter2)
router.get('/token/:tokenNumber', protect, authorize('counter2'), async (req, res) => {
    try {
        const token = await Token.findOne({ tokenNumber: req.params.tokenNumber })
            .populate('createdBy', 'name username');

        if (!token) {
            return res.status(404).json({
                success: false,
                message: 'Token not found'
            });
        }

        res.json({
            success: true,
            data: token,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   PUT /api/tokens/:id/verify
// @desc    Verify/Reject token and upsert student record
// @access  Private (counter2)
router.put('/:id/verify', protect, authorize('counter2'), async (req, res) => {
    try {
        const { status, ...verificationData } = req.body;

        if (status !== 'verified' && status !== 'rejected' && status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const token = await Token.findById(req.params.id);
        if (!token) {
            return res.status(404).json({
                success: false,
                message: 'Token not found'
            });
        }

        // Allow reverting to pending even if already processed
        if (status === 'pending') {
            token.status = 'pending';
            token.verifiedBy = undefined;
            token.verifiedAt = undefined;
            await token.save();

            // Rollback student record if exists
            await Student.findOneAndUpdate(
                { tokenNumber: token.tokenNumber },
                {
                    status: 'pending',
                    admissionNumber: undefined,
                    verifiedBy: undefined,
                    verifiedAt: undefined,
                    rejectionReason: undefined,
                },
                { new: true }
            );

            return res.json({
                success: true,
                data: {
                    token,
                    student: null,
                },
            });
        }

        if (token.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Token is already processed'
            });
        }

        token.status = status;
        token.verifiedBy = req.user._id;
        token.verifiedAt = new Date();
        await token.save();

        let student = null;
        if (status === 'verified') {
            const year = new Date().getFullYear();
            const count = await Student.countDocuments({ status: 'verified' });
            const admissionNumber = `ADM-${year}-${String(count + 1).padStart(4, '0')}`;

            const mergedFormData = {
                ...(token.formData && typeof token.formData === 'object' ? token.formData : {}),
                ...(verificationData.formData && typeof verificationData.formData === 'object' ? verificationData.formData : {}),
            };

            const { formData, ...verificationFields } = verificationData;

            const studentData = {
                tokenNumber: token.tokenNumber,
                studentName: token.studentName,
                fatherName: token.fatherName,
                dateOfBirth: token.dateOfBirth,
                age: token.age,
                currentAddress: token.currentAddress,
                permanentAddress: token.permanentAddress,
                cnic: token.cnic,
                passportNumber: token.passportNumber,
                idType: token.idType,
                contact: token.contact,
                class: token.class,
                category: token.category,
                statusType: token.statusType,
                residency: token.residency,
                photoUrl: token.photoUrl,

                ...verificationFields,
                formData: mergedFormData,
                status: 'verified',
                admissionNumber,
                createdBy: token.createdBy,
                verifiedBy: req.user._id,
                verifiedAt: token.verifiedAt,
            };

            student = await Student.findOneAndUpdate(
                { tokenNumber: token.tokenNumber },
                studentData,
                { new: true, upsert: true, runValidators: true }
            )
                .populate('createdBy', 'name username')
                .populate('verifiedBy', 'name username');
        }

        if (status === 'rejected') {
            const rejectionReason = verificationData.rejectionReason;
            await Student.findOneAndUpdate(
                { tokenNumber: token.tokenNumber },
                {
                    status: 'rejected',
                    rejectionReason,
                    verifiedBy: req.user._id,
                    verifiedAt: token.verifiedAt,
                    formData: {
                        ...(token.formData && typeof token.formData === 'object' ? token.formData : {}),
                        ...(verificationData.formData && typeof verificationData.formData === 'object' ? verificationData.formData : {}),
                    },
                },
                { new: true }
            );
        }

        res.json({
            success: true,
            data: {
                token,
                student,
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

export default router;
