const { sequelize } = require('./config/db');

async function fixEnum() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB...');
    
    // Postgres specific: Alter enum type to add 'Closed'
    await sequelize.query('ALTER TYPE "enum_StudySessions_status" ADD VALUE IF NOT EXISTS \'Closed\'');
    console.log('Successfully added "Closed" to enum_StudySessions_status');
    
    process.exit(0);
  } catch (error) {
    console.error('Failed to update ENUM:', error);
    process.exit(1);
  }
}

fixEnum();
