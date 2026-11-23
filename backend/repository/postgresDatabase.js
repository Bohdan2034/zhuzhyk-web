
const { Pool } = require('pg');

function createPostgresPool() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        throw new Error('DATABASE_URL is not configured');
    }

    return new Pool({
        connectionString,
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 30000,
        max: 10
    });
}

module.exports = { createPostgresPool };
