/**
 * @exports del
 * @exports insert
 * @exports select
 * @exports update
 */

const { parse } = require('pg-connection-string');
const pgp = require('pg-promise')();

const { DATABASE_SSL } = require('../env');
const { createLogger } = require('../logger');
const { camelizeObjectKeys } = require('../util');

const { DATABASE_SCHEMA, DATABASE_URL } = process.env;

const logger = createLogger('DB');
const connection = parse(DATABASE_URL);
const db = pgp({
  ...connection,
  ssl: DATABASE_SSL ? { rejectUnauthorized: false } : false,
});

db.$config.options.error = (err) => {
  logger.error(`${err.toString()}`);
};

db.$config.options.query = ({ query }) => {
  logger.debug(`QUERY: ${query}`);
};

db.$config.options.receive = (data) => {
  logger.debug(`Camelizing column names of: ${JSON.stringify(data)}`);
  camelizeObjectKeys(data);
  logger.debug(`RECEIVE: ${JSON.stringify(data)}`);
};

db.$config.options.schema = DATABASE_SCHEMA;

const addReturningFields = (query, returning = []) => {
  let newQuery = query;
  if (returning.length) {
    newQuery += ` RETURNING ${returning.join(', ')}`;
  }
  return newQuery;
};

const del = async (table, values) => {
  const whereCondition = Object.keys(values)
    .reduce((acc, cur, idx) => {
      acc.push(`${cur}=$${idx + 1}`);
      return acc;
    }, [])
    .join(' AND ');
  await db.none(`DELETE FROM ${table} WHERE ${whereCondition}`, Object.values(values));
};

const insert = async (table, values, returning = []) => {
  const cs = new pgp.helpers.ColumnSet(Object.keys(values[0]), { table });
  const query = addReturningFields(pgp.helpers.insert(values, cs), returning);
  const result = await db.manyOrNone(query);
  return result;
};

const select = async (queryStr, values) => {
  try {
    const data = await db.any(queryStr, values);
    return data;
  } catch (err) {
    logger.error(`SELECT failed. ${err}`);
  }
  return null;
};

const update = async (table, data, columns, returning = []) => {
  const cs = new pgp.helpers.ColumnSet(columns, { table });
  const whereCondition = columns.reduce((acc, cur, idx) => {
    const name = typeof cur === 'string' ? cur : cur.name;
    if (!name.startsWith('?')) {
      return acc;
    }

    let result = acc;
    if (idx) {
      result += ' AND';
    }

    const column = name.substring(1);
    return `${result} v.${column} = t.${column}`;
  }, ' WHERE');

  const query = addReturningFields(
    pgp.helpers.update(data, cs) + whereCondition,
    returning.map((field) => `t.${field}`),
  );
  const result = await db.manyOrNone(query);
  return result;
};

// const upsert = async (table, rowArray, keys) => {
//   const columns = Object.keys(rowArray[0]);
//   const values = rowArray.map((row) => `(${columns.map((col) => `'${row[col]}'`).join(', ')})`).join(', ');
//   const pk = keys.join(', ');
//   const set = columns.map((col) => `${col} = EXCLUDED.${col}`).join(', ');

//   console.log(`INSERT INTO ${table} (${columns.join(', ')}) VALUES ${values} ON CONFLICT (${pk}) DO UPDATE SET ${set};`)
//   return db.manyOrNone(`
//     INSERT INTO ${table} (${columns.join(', ')})
//     VALUES ${values}
//     ON CONFLICT (${pk})
//     DO UPDATE SET ${set};
//   `);
// };

module.exports = {
  del,
  insert,
  select,
  update,
  any: db.any,
};
