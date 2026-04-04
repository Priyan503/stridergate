import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`  ✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`  ⚠️  MongoDB connection failed: ${error.message}`);
    console.log('  ℹ️  Running with in-memory data (no persistence)');
  }
};

export default connectDB;
