import mongoose from 'mongoose';

const gradeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Grade name is required'],
    },
    type: {
        type: String,
        enum: ['Dars-e-Nizami', 'Ma\'had'],
        required: true,
    },
    capacity: {
        type: Number,
        required: true,
        default: 30,
    },
    currentCount: {
        type: Number,
        default: 0,
    },
    testDate: {
        type: Date,
    },
    resultDate: {
        type: Date,
    },
    assignDate: {
        type: Date,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

// Virtual for available seats
gradeSchema.virtual('availableSeats').get(function () {
    return this.capacity - this.currentCount;
});

// Ensure virtuals are included in JSON
gradeSchema.set('toJSON', { virtuals: true });
gradeSchema.set('toObject', { virtuals: true });

const Grade = mongoose.model('Grade', gradeSchema);

export default Grade;
