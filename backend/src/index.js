require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models/sql');
const { connectMongo } = require('./config/dbMongo');

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    await connectMongo();

    app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

start();
