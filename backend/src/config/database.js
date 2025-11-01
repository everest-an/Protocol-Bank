const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'protocol_bank',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  ssl: process.env.DB_HOST && process.env.DB_HOST.includes('rds.amazonaws.com') ? {
    rejectUnauthorized: false
  } : false,
});

pool.on('connect', () => {
  console.log('✅ Database connected');
});

module.exports = { pool };
