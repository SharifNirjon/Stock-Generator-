const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI;
  await mongoose.connect(uri);
  console.log(`MongoDB connected: ${mongoose.connection.name}`);
}

module.exports = connectDB;
