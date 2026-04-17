import mongoose from 'mongoose';
import { seedDatabase } from '../scripts/seed.js';

let mongoMemoryServer = null;

const connectDB = async () => {
  try {
    let uri = process.env.MONGO_URI;

    // Use memory server if specifically requested or if URI is completely missing.
    if (!uri || uri === 'memory') {
      console.log('  ⚠️  No MONGO_URI provided. Booting dynamic in-memory database...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create({
        binary: {
          version: '7.0.14' // Required for Debian 12+ compatibility
        }
      });
      uri = mongoMemoryServer.getUri();
    }

    const conn = await mongoose.connect(uri);
    console.log(`  ✅ MongoDB connected: ${conn.connection.host}`);

    // Automatically seed data if using the ephemeral memory instance
    if (mongoMemoryServer) {
        console.log('  🌱 Automatically seeding the ephemeral database...');
        await seedDatabase(uri);
    }

  } catch (error) {
    console.error(`  ❌ MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
