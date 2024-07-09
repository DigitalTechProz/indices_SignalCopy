const { Pool }  = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.POSTGRE_URL_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const createTable = async () => {
    const client = await pool.connect();
    try {
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(100) NOT NULL,
          password VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
      `;
      await client.query(createTableQuery);
      console.log('Users Table created successfully');
    } catch (error) {
      console.error('Error creating table:', error);
    } finally {
      client.release();
    }
    try {
        const createTableQuery = `
        CREATE TABLE IF NOT EXISTS signals (
          id SERIAL PRIMARY KEY,
          symbol VARCHAR(100) NOT NULL,
          orderType VARCHAR(100) NOT NULL,
          volume VARCHAR(100) NOT NULL,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`;
          
          await client.query(createTableQuery);
          console.log('Signals Table created successfully');
        } catch (error) {
          console.error('Error creating table:', error);
        } finally {
          client.release();
    }


  };

  createTable();
