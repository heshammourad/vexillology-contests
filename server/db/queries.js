/**
 * @exports getCategories
 * @exports getCurrentContest
 * @exports getCurrentContestSubmissions
 * @exports getVoteDates
 */

const { ALLOW_DEV_CONTEST } = require('../env');

const db = require('.');

exports.getCategories = async (contestId) => {
  const categories = await db.select(
    'SELECT category FROM contest_categories WHERE contest_id = $1 ORDER BY sort_order, category',
    [contestId],
  );
  return categories.map(({ category }) => category);
};

exports.getCurrentContest = async () => {
  const [result] = await db.select(
    `SELECT id, name, prompt, submission_start, submission_end, now()
     FROM contests
     WHERE submission_start < now()
     ${ALLOW_DEV_CONTEST ? "AND id = 'dev'" : ''}
     ORDER BY submission_start DESC
     LIMIT 1`,
  );
  return result;
};

exports.getCurrentContestSubmissions = async () => {
  const contest = await this.getCurrentContest();
  if (!contest) {
    return null;
  }

  const submissions = await db.select(
    `SELECT
       ce.category,
       e.background_color,
       e.description,
       e.id,
       '/i/' || e.id || '.png' AS image_path,
       e.modified_by,
       e.name,
       e.rejection_reason,
       e.submission_status,
       e.submission_time,
       e.user
     FROM contest_entries ce, entries e
     WHERE ce.entry_id = e.id AND ce.contest_id = $1
     ORDER BY e.submission_time`,
    [contest.id],
  );
  return submissions;
};

exports.getVoteDates = async (contestId) => {
  const voteDates = await db.select(
    'SELECT vote_start, vote_end, now() FROM contests WHERE id = $1',
    [contestId],
  );
  return voteDates;
};

exports.getVotersData = async (contestId) => {
  const votersData = await db.select(
    `SELECT 
      u.username,
      u.karma,
      u.created_date,
      EXTRACT(EPOCH FROM (NOW() - u.created_date)) / 86400 AS age_in_days,
      COUNT(v.entry_id) as votes_cast,
      (SELECT COUNT(DISTINCT ce.entry_id) 
       FROM contest_entries ce 
       JOIN entries e ON ce.entry_id = e.id 
       WHERE ce.contest_id = $1 AND e.submission_status = 'approved') as total_approved_entries,
      ROUND((COUNT(v.entry_id)::float / 
        (SELECT COUNT(DISTINCT ce.entry_id)::float 
         FROM contest_entries ce 
         JOIN entries e ON ce.entry_id = e.id 
         WHERE ce.contest_id = $1 AND e.submission_status = 'approved') * 100)::numeric, 1) as vote_percentage
    FROM users u
    LEFT JOIN votes v ON u.username = v.username AND v.contest_id = $1
    GROUP BY u.username, u.karma, u.created_date
    HAVING COUNT(v.entry_id) > 0
    ORDER BY vote_percentage DESC, u.username ASC`,
    [contestId],
  );

  return votersData;
};
