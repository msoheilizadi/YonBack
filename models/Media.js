const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Media = sequelize.define('Media', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  type: { type: DataTypes.STRING, allowNull: false }, // 'image', 'audio', 'video', 'document'
  category: { type: DataTypes.STRING, allowNull: false }, // 'slider', 'music', 'meditation', 'sleep', 'kid', 'profile'
  url: { type: DataTypes.STRING(1000), allowNull: false },
  mimeType: { type: DataTypes.STRING },
  size: { type: DataTypes.INTEGER }, // bytes
  order: { type: DataTypes.INTEGER, defaultValue: 0 }, // برای ترتیب اسلایدر
});

module.exports = Media;