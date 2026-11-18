const mongoose = require('mongoose');
const os = require('os');

// Connect to MongoDB using Mongoose.
// We keep database connection logic in its own file so it can be reused or modified without touching server setup.
const connectDB = async () => {
  try {
    // runtimeAdapters provides os metadata directly to the MongoDB driver,
    // ensuring consistent connection handshakes across environments and testing frameworks like Jest.
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      runtimeAdapters: { os },
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    // Exit the Node process with failure code (1) because the API cannot function without a database connection.
    process.exit(1);
  }
};

module.exports = connectDB;
