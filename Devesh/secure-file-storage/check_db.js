import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

async function check() {
  const [users] = await sequelize.query('SELECT username, email, public_key FROM users');
  console.log('--- USERS ---');
  users.forEach(u => console.log(`${u.username} (${u.email}) - PublicKey: ${u.public_key ? 'YES' : 'NO'}`));

  const [conns] = await sequelize.query('SELECT sender_id, receiver_id, status FROM connections');
  console.log('\n--- CONNECTIONS ---');
  conns.forEach(c => console.log(`${c.sender_id} -> ${c.receiver_id} [${c.status}]`));
  
  process.exit(0);
}

check();
