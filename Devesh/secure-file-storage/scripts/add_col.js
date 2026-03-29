import sequelize from '../src/config/database.js';

async function sync() {
    try {
        await sequelize.query("ALTER TABLE users ADD COLUMN security_pin_hash TEXT;");
        console.log('Column added successfully.');
    } catch (e) {
        if (e.message.includes('duplicate column name')) {
            console.log('Column already exists.');
        } else {
            console.log('Error adding column:', e.message);
        }
    } finally {
        process.exit(0);
    }
}

sync();
