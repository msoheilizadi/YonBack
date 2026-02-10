const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Song = sequelize.define('Song', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  subtitle: {
    type: DataTypes.STRING,
  },
  description: {
    type: DataTypes.TEXT,
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  audioUrl: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.ENUM('Meditation', 'Sleep', 'Music', 'Kid'),
    defaultValue: 'Music',
  },
  duration: {
    type: DataTypes.INTEGER, // ثانیه
  },
});

module.exports = Song;