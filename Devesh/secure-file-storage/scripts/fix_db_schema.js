
import sequelize from '../src/config/database.js';

async function fixKnownDevicesSchema() {
    try {
        console.log('--- Database Schema Fix: known_devices ---');
        
        // 1. Drop the existing table to clear all stale constraints
        console.log('Dropping known_devices table...');
        await sequelize.query('DROP TABLE IF EXISTS known_devices;');
        
        console.log('Table dropped successfully.');
        console.log('Sequelize will recreate it with correct indices on the next server start.');
        
    } catch (error) {
        console.error('Error fixing schema:', error.message);
    } finally {
        process.exit(0);
    }
}

fixKnownDevicesSchema();
