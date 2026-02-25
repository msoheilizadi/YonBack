const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

// 👈 حالا Sequelize کل اطلاعات اتصال را از یک رشته (DATABASE_URL) می‌خواند
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false, // برای تمیز ماندن کنسول
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL Connected Successfully via DATABASE_URL.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

module.exports = { sequelize, connectDB };