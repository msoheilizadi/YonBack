const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User'); // برای ایجاد ارتباط با کاربر

const Zarat = sequelize.define('Zarat', {
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
  date: {
    type: DataTypes.STRING, // چون فرانت‌اند تاریخ را به صورت رشته می‌فرستد
    allowNull: false,
  },
  mood: {
    type: DataTypes.INTEGER, // شماره ایندکس احساس (0 تا 7)
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
});

// تعریف ارتباط: هر کاربر می‌تواند چندین رکورد "ذرات" داشته باشد
User.hasMany(Zarat, { foreignKey: 'userId' });
Zarat.belongsTo(User, { foreignKey: 'userId' });

module.exports = Zarat;