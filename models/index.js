const { sequelize } = require('../config/db');
const User = require('./User');
const StudySession = require('./StudySession');
const SessionMember = require('./SessionMember');
const Message = require('./Message');
const StudyLog = require('./StudyLog');

// 1. Users and StudySessions (Creator)
User.hasMany(StudySession, { foreignKey: 'creator_id', as: 'createdSessions' });
StudySession.belongsTo(User, { foreignKey: 'creator_id', as: 'creator' });

// 2. Users and StudySessions (Members Many-to-Many via SessionMember)
User.belongsToMany(StudySession, { through: SessionMember, foreignKey: 'user_id', as: 'joinedSessions' });
StudySession.belongsToMany(User, { through: SessionMember, foreignKey: 'session_id', as: 'members' });

// 3. User, StudySession and Messages (Group Chat)
User.hasMany(Message, { foreignKey: 'user_id' });
Message.belongsTo(User, { foreignKey: 'user_id' });

StudySession.hasMany(Message, { foreignKey: 'session_id' });
Message.belongsTo(StudySession, { foreignKey: 'session_id' });

// 4. User and StudyLogs
User.hasMany(StudyLog, { foreignKey: 'user_id' });
StudyLog.belongsTo(User, { foreignKey: 'user_id' });

// Initialize database syncing (use force: false for production)
const syncDB = async () => {
  try {
    // Note: Do not use { force: true } in production, it will drop tables
    await sequelize.sync({ alter: true });
    console.log('All models were synchronized successfully.');
  } catch (error) {
    console.error('Error synchronizing models:', error);
  }
};

module.exports = {
  sequelize,
  syncDB,
  User,
  StudySession,
  SessionMember,
  Message,
  StudyLog
};
