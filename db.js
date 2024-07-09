const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.POSTGRE_URL_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;