import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
    notifications: {
        newAdmission: { type: Boolean, default: true },
        verificationReminder: { type: Boolean, default: true },
        emailNotifications: { type: Boolean, default: false },
    },
    appearance: {
        darkMode: { type: Boolean, default: false },
        compactSidebar: { type: Boolean, default: false },
    },
}, {
    timestamps: true,
});

const Setting = mongoose.model('Setting', settingSchema);

export default Setting;
