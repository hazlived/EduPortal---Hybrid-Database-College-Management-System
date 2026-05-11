const mongoose = require('mongoose');

async function connectMongo() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/college_academic';
  await mongoose.connect(uri, { autoIndex: true });
  console.log('Connected to MongoDB');
}

module.exports = { connectMongo };
