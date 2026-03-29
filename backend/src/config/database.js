const { Pool } = require('pg');
require('dotenv').config();

// Supabase connection configuration - using connection string directly
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  console.log('✅ Supabase database connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected Supabase database error:', err);
  process.exit(-1);
});

module.exports = pool;
