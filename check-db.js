const { sequelize } = require('./config/db');

async function checkColumns() {
  try {
    await sequelize.authenticate();
    const [results] = await sequelize.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'StudySessions'");
    console.log('Columns in StudySessions:', JSON.stringify(results, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkColumns();
