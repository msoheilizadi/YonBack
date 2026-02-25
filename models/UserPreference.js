const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User'); // ارتباط با جدول کاربر

const UserPreference = sequelize.define('UserPreference', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  // ستون‌های مربوط به پاسخ‌های پرسشنامه
  impact: { type: DataTypes.STRING, allowNull: true },
  experience: { type: DataTypes.STRING, allowNull: true },
  best_time: { type: DataTypes.STRING, allowNull: true },
  duration: { type: DataTypes.STRING, allowNull: true },
});

// تعریف ارتباط: هر کاربر فقط یک "پروفایل تنظیمات" دارد
User.hasOne(UserPreference, { foreignKey: 'userId' });
UserPreference.belongsTo(User, { foreignKey: 'userId' });

module.exports = UserPreference;