const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const StudySession = sequelize.define('StudySession', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  course: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  time: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  creator_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  max_members: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
  },
  skill_level: {
    type: DataTypes.ENUM('Beginner', 'Intermediate', 'Advanced'),
    defaultValue: 'Beginner',
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Open',
  }
}, {
  timestamps: true,
});

module.exports = StudySession;
