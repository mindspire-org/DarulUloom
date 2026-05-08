import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { networkInterfaces } from 'os';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import User from './models/User.js';
import Grade from './models/Grade.js';

// Import routes
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import tokenRoutes from './routes/tokens.js';
import gradeRoutes from './routes/grades.js';
import userRoutes from './routes/users.js';
import statsRoutes from './routes/stats.js';
import reportsRoutes from './routes/reports.js';
import settingsRoutes from './routes/settings.js';
import fs from 'fs';

// Load environment variables
dotenv.config(process.env.DOTENV_CONFIG_PATH ? { path: process.env.DOTENV_CONFIG_PATH } : undefined);

// Validate required environment variables
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error(`❌ Critical environment variables missing: ${missingEnvVars.join(', ')}`);
    console.error('💡 Please check your .env file.');
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create required upload directories
const uploadDirs = [
    path.join(__dirname, '../uploads/photos'),
    path.join(__dirname, '../uploads/certificates')
];

uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
    }
});

// Connect to MongoDB
await connectDB();

// Auto-seed default admin user (idempotent)
try {
    const shouldAutoSeed =
        process.env.AUTO_SEED_ADMIN === 'true' ||
        (!process.env.AUTO_SEED_ADMIN && process.env.NODE_ENV !== 'production');

    if (shouldAutoSeed) {
        const username = 'admin';
        const password = '123456';
        const name = 'Admin';

        const existing = await User.findOne({ username });
        if (!existing) {
            await User.create({
                username,
                password,
                name,
                role: 'admin',
                isActive: true,
            });
            console.log(`✅ Default admin seeded: ${username}`);
        } else if (process.env.FORCE_SEED_ADMIN === 'true') {
            existing.name = name;
            existing.role = 'admin';
            existing.isActive = true;
            existing.password = password;
            await existing.save();
            console.log(`✅ Default admin updated (FORCE_SEED_ADMIN): ${username}`);
        }
    }
} catch (e) {
    console.error('⚠️ Admin auto-seed skipped due to error:', e?.message || e);
}

// Initialize Express app
const app = express();

// Middleware - CORS configuration for LAN access
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);

        // Allow production domain
        if (origin === 'https://darululoom.healthspire.org' || origin === 'http://darululoom.healthspire.org') {
            return callback(null, true);
        }

        // Electron/desktop apps often send no origin or "null" when loading from file://
        if (origin === 'null' || origin.startsWith('file://')) {
            return callback(null, true);
        }

        // Allow localhost origins
        if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
            return callback(null, true);
        }

        // Allow LAN origins (private IP ranges: 10.x.x.x, 172.16-31.x.x, 192.168.x.x)
        const lanIpPattern = /^https?:\/\/(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})(:\d+)?$/;
        if (lanIpPattern.test(origin)) {
            return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);

// Health check route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Madrasa Admission System API is running',
        timestamp: new Date().toISOString(),
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: err.message || 'Server Error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Server running on port ${PORT}`);

    // Get local IP address for LAN access
    const nets = networkInterfaces();
    const results = {};

    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal) {
                if (!results[name]) {
                    results[name] = [];
                }
                results[name].push(net.address);
            }
        }
    }

    const lanIp = results['Ethernet']?.[0] || results['Wi-Fi']?.[0];

    console.log(`\n🌐 Server is accessible on the network at:`);
    if (lanIp) {
        console.log(`   - LAN: http://${lanIp}:${PORT}`);
    } else {
        console.log('   - LAN: Could not determine local IP address. Check network connection.');
    }
    console.log(`   - Local: http://localhost:${PORT}`);
});
