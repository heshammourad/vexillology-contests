const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const query = async (queryStr, values) => {
  const client = await pool.connect();
  try {
    const result = await client.query(queryStr, values);
    return result;
  } finally {
    client.release();
  }
};

const select = async (queryStr, values) => {
  const result = await query(queryStr, values);
  return result;
};

module.exports = { select };
