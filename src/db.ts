
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.IS_PRODUCTION === 'true';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: isProduction ? { rejectUnauthorized: true } : false
});

export default pool;