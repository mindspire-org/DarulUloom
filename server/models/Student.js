import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
    // Token Info (Counter 1)
    tokenNumber: {
        type: String,
        // unique: true,
    },
    studentName: {
        type: String,
        // required: [true, 'Student name is required'],
    },
    fatherName: {
        type: String,
        // required: [true, 'Father name is required'],
    },
    dateOfBirth: {
        type: String,
    },
    age: {
        type: String,
    },
    currentAddress: {
        type: String,
    },
    permanentAddress: {
        type: String,
    },
    cnic: {
        type: String,
    },
    passportNumber: {
        type: String,
    },
    idType: {
        type: String,
        enum: ['cnic', 'passport'],
        default: 'cnic',
    },
    contact: {
        type: String,
        // required: [true, 'Contact number is required'],
    },
    class: {
        type: String,
        // required: [true, 'Class is required'],
    },
    category: {
        type: String,
        enum: ['Wafaq', 'Non-Wafaq'],
        // required: true,
        set: (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    },
    statusType: {
        type: String,
        enum: ['قدیم', 'جدید'],
        default: 'جدید',
    },
    residency: {
        type: String,
        enum: ['مقیم', 'غیر مقیم'],
    },
    photoUrl: {
        type: String,
    },
    testDate: {
        type: Date,
    },
    resultDate: {
        type: Date,
    },
    qrCode: {
        type: String,
    },

    // Verification Info (Counter 2)
    previousMadrasa: String,
    previousClass: String,
    performance: {
        type: String,
        set: (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    },
    wafaqRollNo: String,
    notes: String,

    // Counter 2 – Verification Page fields
    wafaqExamYear: String,
    federalVerificationStatus: {
        type: String,
        enum: ['pending', 'eligible', 'not_eligible'],
        default: 'pending',
    },
    certificateUrl: String,
    madrasaContact: String,
    nonFederalReviewStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    nonFederalReviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    nonFederalReviewedAt: Date,

    // Guardian/Parent Information
    guardianName: String,
    guardianRelation: String,
    guardianCNIC: String,
    guardianContact: String,
    guardianProfession: String,
    guardianAddress: String,

    // Detailed Academic Information
    previousEducation: String,
    lastExamResult: String,
    hafizStatus: {
        type: String,
        enum: ['مکمل', 'ناظرہ', 'جاری'],
        set: (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    },
    islamicEducationYears: String,

    // Physical & Medical Information
    bloodGroup: String,
    medicalConditions: String,
    emergencyContact: String,

    // Declaration & Signatures
    declarationAccepted: {
        type: Boolean,
        default: false,
    },
    studentSignature: String,
    guardianSignature: String,
    adminSignature: String,
    formCompletedAt: Date,

    // Office Use Only
    admissionApproved: Boolean,
    feeReceived: Number,
    approvalDate: Date,
    approvalRemarks: String,

    // Admission Info
    admissionNumber: String,
    status: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending',
    },
    rejectionReason: String,

    // Tracking
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    verifiedAt: Date,

    formData: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: true,
});

const Student = mongoose.model('Student', studentSchema);

export default Student;
