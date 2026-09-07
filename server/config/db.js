/**
 * config/db.js — MongoDB Atlas Connection
 *
 * Exports an async connectDB() function that creates a Mongoose connection
 * to MongoDB Atlas using the MONGODB_URI environment variable.
 *
 * Called once at server startup (from server.js).
 * Exits the process on failure so Render/PM2 can restart cleanly.
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);
  } catch (error) {
    // Log only the message — never log the full URI (contains credentials)
    console.error(`❌ MongoDB Connection Failed: ${error.message}`);
    console.error('   Check your MONGODB_URI in the .env file.');

    // Exit with non-zero code so the process manager can restart
    process.exit(1);
  }
};

module.exports = connectDB;

