/**
 * config/db.js — MongoDB Atlas Connection
 *
 * This file exports a function that connects Mongoose to MongoDB Atlas.
 * It will be called once when the server starts.
 *
 * STATUS: Placeholder for Step 2
 * ─────────────────────────────
 * In Step 2, uncomment the connectDB() call in server.js
 * and fill in your MONGO_URI in the .env file.
 *
 * Usage (in server.js):
 *   const connectDB = require('./config/db');
 *   connectDB();
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // MONGO_URI is loaded from .env by dotenv in server.js
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);

    // Exit the process with failure code so Render/server restarts it
    process.exit(1);
  }
};

module.exports = connectDB;
