import mongoose from 'mongoose';

let mongoServer = null;

const connectDB = async () => {
    try {
        let mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/madrasa_admission';
        
        if (!mongoUri || typeof mongoUri !== 'string') {
            throw new Error('MONGO_URI is missing. Set it in .env/.env.local for the packaged app (resources/.env or resources/.env.local).');
        }

        // Try to connect to the provided MongoDB URI first
        let conn;
        try {
            conn = await mongoose.connect(mongoUri, {
                serverSelectionTimeoutMS: 5000,
                connectTimeoutMS: 5000,
            });
            console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
            console.log(`📊 Database: ${conn.connection.name}`);
            return;
        } catch (localError) {
            // If local MongoDB fails and we're in development, use in-memory MongoDB
            // In production (Electron), we DON'T want to use in-memory DB as it requires the package
            if (process.env.NODE_ENV === 'development' && mongoUri.includes('localhost')) {
                console.log('⚠️  Local MongoDB not available, starting in-memory MongoDB...');
                
                try {
                    const { MongoMemoryServer } = await import('mongodb-memory-server');
                    mongoServer = await MongoMemoryServer.create();
                    mongoUri = mongoServer.getUri();
                    process.env.MONGO_URI = mongoUri; // Update env for other parts of the app
                    
                    conn = await mongoose.connect(mongoUri, {
                        serverSelectionTimeoutMS: 10000,
                        connectTimeoutMS: 10000,
                    });
                    console.log(`✅ In-Memory MongoDB Connected: ${conn.connection.host}`);
                    console.log(`📊 Database: ${conn.connection.name}`);
                    console.log(`📝 Data will NOT persist after restart (dev mode only)`);
                    return;
                } catch (importError) {
                    console.error('❌ Failed to load mongodb-memory-server:', importError.message);
                    throw localError;
                }
            }
            throw localError;
        }
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        throw error;
    }
};

// Cleanup function for graceful shutdown
export const disconnectDB = async () => {
    await mongoose.disconnect();
    if (mongoServer) {
        await mongoServer.stop();
        console.log('✅ In-memory MongoDB stopped');
    }
};

export default connectDB;
