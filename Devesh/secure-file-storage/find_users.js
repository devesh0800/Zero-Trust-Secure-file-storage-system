import { User } from './src/models/index.js';
import { testConnection } from './src/config/database.js';

async function getUsers() {
    await testConnection();
    const users = await User.findAll({ limit: 1 });
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
}

getUsers();
