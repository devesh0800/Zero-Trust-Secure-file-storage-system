
import sequelize from '../src/config/database.js';
import KnownDevice from '../src/models/KnownDevice.js';

async function check() {
    try {
        const [indices] = await sequelize.query('PRAGMA index_list(known_devices)');
        console.log('INDEX LIST:', JSON.stringify(indices, null, 2));

        for (const idx of indices) {
            const [cols] = await sequelize.query(`PRAGMA index_info(${idx.name})`);
            console.log(`INDEX INFO FOR ${idx.name}:`, JSON.stringify(cols, null, 2));
        }

        const [info] = await sequelize.query('PRAGMA table_info(known_devices)');
        console.log('TABLE INFO:', JSON.stringify(info, null, 2));
    } catch (e) {
        console.error('ERROR:', e.message);
    } finally {
        process.exit(0);
    }
}

check();
