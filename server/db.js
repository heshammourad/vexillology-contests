/* eslint-disable no-console */
const { parse } = require('pg-connection-string');
const pgp = require('pg-promise')();

const connection = parse(process.env.DATABASE_URL);
const db = pgp({ ...connection, ssl: { rejectUnauthorized: false } });

const select = async (queryStr, values) => {
  try {
    const data = await db.any(queryStr, values);
    return data;
  } catch (err) {
    console.error(err);
  }
  return null;
};

const insert = async (table, values) => {
  const cs = new pgp.helpers.ColumnSet(Object.keys(values[0]), { table });
  const query = pgp.helpers.insert(values, cs);
  await db.none(query);
};

module.exports = { insert, select };
