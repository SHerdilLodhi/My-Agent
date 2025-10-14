const mongoose = require('mongoose');

// MongoDB connection configuration
const connectDB = async () => {
  try {
    const uri = process.env.MONGO_CONNECTION_STRING || process.env.MONGODB_URI;
    
    if (!uri) {
      throw new Error('MongoDB connection string not found in environment variables');
    }

    const conn = await mongoose.connect(uri);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Set up connection event listeners
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Import and export models
const { User, UserToken } = require('../models');

module.exports = {
  connectDB,
  User,
  UserToken,
  mongoose
};
