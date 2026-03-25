const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SessionMember = sequelize.define('SessionMember', {
  joined_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  timestamps: false,
});

module.exports = SessionMember;
