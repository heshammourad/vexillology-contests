const db = require('../../db');
const { CONTEST_ENV_LEVEL } = require('../../env');
const { createLogger } = require('../../logger');

const logger = createLogger('API/CONTEST/DB');

const filterRepeatedIds = (data, idField) => {
  const ids = new Set();
  const filteredData = [];
  const repeatedIds = [];
  data.forEach((datum) => {
    const id = datum[idField];
    if (ids.has(id)) {
      repeatedIds.push(id);
    } else {
      filteredData.push(datum);
    }
    ids.add(id);
  });
  return { filteredData, repeatedIds };
};

exports.addContestEntries = async (contestId, entries) => {
  const { filteredData, repeatedIds } = filterRepeatedIds(entries, 'id');
  if (repeatedIds.length) {
    logger.warn(
      `Error adding contest entries. Repeated ids: ${repeatedIds.join(', ')}`,
    );
  }
  await db.insert(
    'contest_entries',
    filteredData.map((entry) => ({
      contest_id: contestId,
      entry_id: entry.id,
      rank: entry.rank,
    })),
  );
};

exports.addEntries = async (entries) => {
  const { filteredData, repeatedIds } = filterRepeatedIds(entries, 'id');
  if (repeatedIds.length) {
    logger.warn(
      `Error adding entries. Repeated ids: ${repeatedIds.join(', ')}`,
    );
  }
  await db.insert('entries', filteredData);
};

exports.getContest = async (contestId) => db.select(
  `SELECT
    date,
    local_voting,
    name,
    prompt,
    submission_end,
    submission_start,
    subtext,
    valid_reddit_id,
    winners_thread_id
  FROM contests
  WHERE id = $1 AND env_level >= $2`,
  [contestId, CONTEST_ENV_LEVEL],
);

exports.getContestEntries = async (contestId) => db.select(
  `SELECT *
  FROM entries e
  JOIN contest_entries ce
    on e.id = ce.entry_id
  WHERE ce.contest_id = $1`,
  [contestId],
);

exports.getEntriesByIds = async (ids) => db.select('SELECT * FROM entries WHERE id = ANY ($1)', [ids]);

exports.updateContestEntries = async (contestEntries, fields) => db.update('contest_entries', contestEntries, fields);

exports.updateEntries = async (entries, fields) => db.update('entries', entries, fields);
