const { parse } = require('pg-connection-string');
const pgp = require('pg-promise')();

const { createLogger } = require('./logger');
const { camelizeObjectKeys } = require('./util');

const { DATABASE_SCHEMA, DATABASE_URL } = process.env;

const logger = createLogger('DB');

const connection = parse(DATABASE_URL);
const db = pgp({ ...connection, ssl: { rejectUnauthorized: false } });

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

const select = async (queryStr, values) => {
  try {
    const data = await db.any(queryStr, values);
    return data;
  } catch (err) {
    logger.error(`SELECT failed. ${err}`);
  }
  return null;
};

const insert = async (table, values) => {
  const cs = new pgp.helpers.ColumnSet(Object.keys(values[0]), { table });
  const query = pgp.helpers.insert(values, cs);
  await db.none(query);
};

const update = async (data, columns, table) => {
  const cs = new pgp.helpers.ColumnSet(columns, { table });
  const whereCondition = columns.reduce((acc, cur, idx) => {
    if (!cur.startsWith('?')) {
      return acc;
    }

    let result = acc;
    if (idx) {
      result += ' AND';
    }

    const column = cur.substring(1);
    return `${result} v.${column} = t.${column}`;
  }, ' WHERE');

  const query = pgp.helpers.update(data, cs) + whereCondition;
  await db.none(query);
};

module.exports = { insert, select, update };
