import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

async function check() {
  const [cols] = await sequelize.query('PRAGMA table_info(known_devices)');
  console.log('--- known_devices COLUMNS ---');
  for (const c of cols) {
      console.log(`${c.name} [${c.type}] - PK: ${c.pk}`);
  }
  
  const [indices] = await sequelize.query('PRAGMA index_list(known_devices)');
  console.log('\n--- known_devices INDICES ---');
  for (const i of indices) {
      const [icols] = await sequelize.query(`PRAGMA index_info('${i.name}')`);
      console.log(`Index: ${i.name} (Unique: ${i.unique}) - Columns: ${icols.map(ic => ic.name).join(', ')}`);
  }

  process.exit(0);
}

check();
