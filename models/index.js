const { sequelize } = require('../config/db');
const User = require('./User');
const StudySession = require('./StudySession');
const SessionMember = require('./SessionMember');
const Message = require('./Message');
const StudyLog = require('./StudyLog');
const File = require('./File');

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

// 5. Files and Sessions
StudySession.hasMany(File, { foreignKey: 'session_id' });
File.belongsTo(StudySession, { foreignKey: 'session_id' });

User.hasMany(File, { foreignKey: 'user_id' });
File.belongsTo(User, { foreignKey: 'user_id' });

// Initialize database syncing (use force: false for production)
const syncDB = async () => {
  try {
    // 0. Manual column check for description (alter: true can be finicky)
    try {
      await sequelize.query('ALTER TABLE "StudySessions" ADD COLUMN IF NOT EXISTS "description" TEXT');
      console.log('Ensured "description" column exists in StudySessions');
    } catch (e) {
      console.error('Column check error:', e.message);
    }

    // Note: Do not use { force: true } in production, it will drop tables
    await sequelize.sync({ alter: true });
    
    // One-time fix: Add creators to their sessions
    try {
      const { StudySession, SessionMember } = require('./index');
      const sessions = await StudySession.findAll();
      let fixed = 0;
      for (const s of sessions) {
        const isM = await SessionMember.findOne({ where: { session_id: s.id, user_id: s.creator_id } });
        if (!isM) {
          await SessionMember.create({ session_id: s.id, user_id: s.creator_id });
          fixed++;
        }
      }
      if (fixed > 0) console.log(`Backfilled ${fixed} session memberships for hosts.`);
    } catch (e) { 
      console.log('Membership fix error:', e.message); 
    }

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
  StudyLog,
  File
};
