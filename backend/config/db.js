const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (uri && uri.trim() !== '') {
    try {
      console.log('Connecting to MongoDB Atlas / configured URI...');
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(` MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (err) {
      console.warn(`! MongoDB direct connection failed (${err.message}).`);
      if (process.env.NODE_ENV === 'production') {
        console.error('Fatal: Production requires a working MongoDB connection.');
        process.exit(1);
      }
      console.log('Falling back to local in-memory MongoDB for local development...');
    }
  } else if (process.env.NODE_ENV === 'production') {
    console.error('Fatal: MONGODB_URI environment variable is required in production.');
    process.exit(1);
  }

  // Development Fallback: In-Memory MongoDB
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongodInstance = await MongoMemoryServer.create();
    const memoryUri = mongodInstance.getUri();
    const conn = await mongoose.connect(memoryUri);
    console.log(` In-Memory MongoDB Initialized: ${conn.connection.host}`);
    console.log('ℹ (You can set MONGODB_URI in backend/.env anytime to use MongoDB Atlas)');
  } catch (memErr) {
    console.error('Fatal: Failed to initialize in-memory MongoDB:', memErr.message);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
};

module.exports = { connectDB, disconnectDB };

