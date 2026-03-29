import { User } from '../src/models/index.js';
import sequelize from '../src/config/database.js';

async function check() {
    try {
        const users = await User.findAll({ 
            attributes: ['id', 'email', 'username', 'security_pin_hash'] 
        });
        console.log('='.repeat(50));
        console.log('USER DATABASE SNAPSHOT');
        console.log('='.repeat(50));
        users.forEach(u => {
            console.log(`User: ${u.email} | PIN Hash Present: ${!!u.security_pin_hash}`);
        });
        console.log('='.repeat(50));
        process.exit(0);
    } catch (e) {
        console.error('Check failed:', e);
        process.exit(1);
    }
}

check();
