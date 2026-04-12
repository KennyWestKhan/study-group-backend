const { StudySession, SessionMember } = require('./models');

async function fixMemberships() {
  try {
    const sessions = await StudySession.findAll();
    console.log(`Found ${sessions.length} sessions. Checking memberships...`);
    
    for (const session of sessions) {
      const isMember = await SessionMember.findOne({
        where: {
          session_id: session.id,
          user_id: session.creator_id
        }
      });
      
      if (!isMember) {
        console.log(`Adding creator ${session.creator_id} to session ${session.id}`);
        await SessionMember.create({
          session_id: session.id,
          user_id: session.creator_id
        });
      }
    }
    
    console.log('Fix complete.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixMemberships();
