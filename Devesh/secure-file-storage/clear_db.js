import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: true
});

async function clear() {
  const tables = [
    'known_devices',
    'refresh_tokens',
    'audit_logs',
    'shared_files',
    'files',
    'connections',
    'users'
  ];

  console.log('--- CLEARING ALL DATABASE DATA ---');
  for (const table of tables) {
    try {
        await sequelize.query(`DELETE FROM ${table}`);
        console.log(`✓ Cleared ${table}`);
    } catch (e) {
        console.warn(`! Skipped ${table} (maybe not exist yet)`);
    }
  }
  
  process.exit(0);
}

clear();
