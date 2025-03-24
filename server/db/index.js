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

const getReturningClause = (returning = []) => {
  if (!returning.length) {
    return '';
  }
  return ` RETURNING ${returning.join(', ')}`;
};

const del = async (table, values) => {
  const whereCondition = Object.keys(values)
    .reduce((acc, cur, idx) => {
      acc.push(`${cur}=$${idx + 1}`);
      return acc;
    }, [])
    .join(' AND ');
  await db.none(
    `DELETE FROM ${table} WHERE ${whereCondition}`,
    Object.values(values),
  );
};

const insert = async (table, values, additionalOptions = {}) => {
  const { conflictTargets = [], returning = [] } = additionalOptions;
  const cs = new pgp.helpers.ColumnSet(Object.keys(values[0]), { table });

  let query = pgp.helpers.insert(values, cs);
  if (conflictTargets.length) {
    query += ` ON CONFLICT (${conflictTargets.join(
      ', ',
    )}) DO UPDATE SET ${cs.assignColumns({
      from: 'EXCLUDED',
      skip: conflictTargets,
    })}`;
  }
  query += getReturningClause(returning);

  const result = await db.manyOrNone(query);
  return result;
};

const select = async (queryStr, values, isOne = false) => {
  try {
    return isOne
      ? await db.oneOrNone(queryStr, values)
      : await db.any(queryStr, values);
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

  const query = pgp.helpers.update(data, cs)
    + whereCondition
    + getReturningClause(returning.map((field) => `t.${field}`));
  const result = await db.manyOrNone(query);
  return result;
};

module.exports = {
  del,
  insert,
  select,
  update,
  any: db.any,
};
