const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const StudyLog = sequelize.define('StudyLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  topic: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  hours_studied: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  logged_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
});

module.exports = StudyLog;
