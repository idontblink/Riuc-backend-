const pool = require('../db');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('✅ Database schema initialized successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error initializing database:', err.message);
    process.exit(1);
  }
}

initializeDatabase();