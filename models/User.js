const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  profileImage: {
    // تغییر مهم: استفاده از TEXT به جای STRING برای ذخیره عکس‌های Base64 طولانی
    type: DataTypes.TEXT, 
    defaultValue: "",
  },
  mobile: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  language: {
    type: DataTypes.STRING,
    defaultValue: "فارسی",
  },
  notificationTime: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  activeToken: {
    type: DataTypes.TEXT, 
    allowNull: true,
  }
});

module.exports = User;