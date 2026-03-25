import { Sequelize } from 'sequelize';
import config from './config.js';

/**
 * Database connection using Sequelize ORM
 * Configured with connection pooling for production use
 */
const dbOptions = {
    dialect: config.database.dialect,
    logging: config.database.logging,
    define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true
    }
};

if (config.database.dialect === 'sqlite') {
    dbOptions.storage = config.database.storage || './database.sqlite';
} else {
    dbOptions.host = config.database.host;
    dbOptions.port = config.database.port;
    dbOptions.pool = config.database.pool;
}

const sequelize = config.database.dialect === 'sqlite'
    ? new Sequelize({ ...dbOptions })
    : new Sequelize(
        config.database.name,
        config.database.user,
        config.database.password,
        dbOptions
    );

/**
 * Test database connection
 */
export async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('✓ Database connection established successfully');
        return true;
    } catch (error) {
        console.error('✗ Unable to connect to database:', error.message);
        throw error;
    }
}

/**
 * Sync database models
 * WARNING: Use { force: true } only in development to drop tables
 */
export async function syncDatabase(options = {}) {
    try {
        await sequelize.sync(options);
        console.log('✓ Database synchronized successfully');
    } catch (error) {
        console.error('✗ Database sync failed:', error.message);
        throw error;
    }
}

export default sequelize;
