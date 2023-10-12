/*
TO DO
  NOTE!!! you just need to make sure to await and res.send() before you mutate

  2. You need a name from submission
1. You need entries for VOTING and beyond to work

Eliminate a lot of the VIEW_VOTING / VIEW_SUBMISSION
Consider adding categories, entries for review, entries for voting, entries for results
Function to control moderator (may require creating user)
*/

const db = require('../db');
const { createLogger } = require('../logger');

const logger = createLogger('API/DEV');

const getDevContest = (status) => {
  const contestStatuses = ['prerelease', 'reset', 'submission', 'review', 'voting', 'results'];
  const contestIndex = contestStatuses.indexOf(status);
  const isAfter = (lastStatus) => contestIndex > contestStatuses.indexOf(lastStatus);

  const now = new Date();
  const yearEnd = now.getMonth() === 11; // getMonth is zero-based
  const date = now.toISOString().split('T')[0];
  const fiveYears = 1000 * 60 * 60 * 24 * 365 * 5;
  const pastest = new Date(now.getTime() - fiveYears - 1).toISOString();
  const past = new Date(now.getTime() - fiveYears).toISOString();
  const future = new Date(now.getTime() + fiveYears).toISOString();
  const futurest = new Date(now.getTime() + fiveYears + 1).toISOString();

  /*
                s_start   s_end     v_start   v_end
    prerelease  future    futurest  future    futurest
    submission  pastest   futurest  future    futurest
    review      pastest   past      future    futurest
    voting      pastest   past      pastest   futurest
    results     pastest   past      pastest   past
  */

  return {
    id: 'dev',
    name: status === 'reset' ? 'submission' : status,
    date,
    env_level: 'dev',
    year_end: yearEnd,
    winners_thread_id: null,
    valid_reddit_id: false,
    submission_start: isAfter('prerelease') ? pastest : future,
    submission_end: isAfter('submission') ? past : futurest,
    vote_start: (isAfter('review') ? pastest : future) + 2, // avoid vote before submission
    vote_end: (isAfter('voting') ? past : futurest) + 2, // avoid vote before submission
    subtext: 'Dev subtext',
    local_voting: true,
    prompt: 'This is the prompt for the development contest.',
  };
};

exports.contest = async ({ body: { status } }, res) => {
  try {
    const isExisting = (await db.any("SELECT EXISTS (SELECT 1 FROM contests WHERE id='dev')"))[0].exists;

    if (status === 'reset') {
      // Reset only applies to entries and voting
      // Reset does not change the contest period (submission, voting)
      if (!isExisting) {
        await db.insert('contests', [getDevContest(status)]);
      }
      //   // delete all 'dev' contest entries and votes
      //   // re-add the original
      //   // ALREADY TESTED
      //   await db.del('users', { username: 'dev' });
      //   await db.insert('users', [{ username: 'dev', contest_reminders: true, moderator: false }]);

      //   // FUTURE: contest_categories
      //   // FUTURE: submission entry
      //   // FUTURE: voting flags (dev user 2)
      //   // FUTURE: results flags (dev user 2)
    } else {
      // Easier to refresh entire dev entry instead of upsert/update the dates
      if (isExisting) {
        await db.del('contests', { id: 'dev' });
      }
      await db.insert('contests', [getDevContest(status)]);
    }

    res.send();

    // Create user "dev"
  } catch (err) {
    // console.log('contest error: ', err);
    logger.error(`Error (re)setting /vote: ${err}`);
    res.status(500).send();
  }
};

exports.mod = async ({ body: { moderator }, username }, res) => {
  try {
    // Create user "dev"
    const user = await db.select(`SELECT moderator
    FROM users
    WHERE username = $1`, [username]);

    let status;
    if (!user.length) {
      await db.insert('users', [{ username, contest_reminders: true, moderator }]);
      status = 201;
    } else {
      await db.update('users', [{ username, moderator }], ['?username', 'moderator']);
      status = 200;
    }

    res.status(status).send();
  } catch (err) {
    // console.log('mod error: ', err);
    logger.error(`Error toggling /mod: ${err}`);
    res.status(500).send();
  }
};



/*
exports.reset = async (req, res) => {
  try {
    // Create and populate table contests_dev
    const devContests = 'contests_dev';
    const hold = await db.any(`SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '${devContests}');`)
    if (hold[0].exists) {
      await db.any(`DROP TABLE ${devContests}`);
    }

    await db.any(`CREATE TABLE ${devContests} (
      id character varying NOT NULL,
      name character varying NOT NULL,
      date date,
      env_level vexillology_contests_backup.env_level DEFAULT 'dev'::vexillology_contests_backup.env_level,
      year_end boolean DEFAULT false NOT NULL,
      winners_thread_id character varying,
      valid_reddit_id boolean DEFAULT true NOT NULL,
      vote_start timestamp with time zone,
      vote_end timestamp with time zone,
      subtext character varying,
      local_voting boolean DEFAULT true NOT NULL,
      submission_start timestamp with time zone,
      submission_end timestamp with time zone,
      prompt character varying,
      CONSTRAINT contests_check CHECK (((vote_end > vote_start) AND (submission_end > submission_start)))
    );`);

    const fields = ['id', 'name', 'date', 'env_level', 'year_end', 'winners_thread_id', 'valid_reddit_id', 'vote_start', 'vote_end', 'subtext', 'local_voting', 'submission_start', 'submission_end', 'prompt'];
    const contests = [
      ['prerelease', 'Prerelease', date, 'dev', false, null, true, future, futurest, 'Prelease subtext', true, future, futurest, 'Prerelease prompt'],
      ['submission', 'Submission', date, 'dev', false, null, true, future, futurest, 'Submission subtext', true, pastest, futurest, 'Submission prompt'],
      ['review', 'Review', date, 'dev', false, null, true, future, futurest, 'Review subtext', true, pastest, past, 'Review prompt'],
      ['voting', 'Voting', date, 'dev', false, null, true, pastest, futurest, 'Voting subtext', true, pastest, past, 'Voting prompt'],
      ['results', 'Results', date, 'dev', false, null, true, pastest, past, 'Results subtext', true, pastest, past, 'Results prompt'],
    ];

    
    await db.insert(
      devContests,
      // eslint-disable-next-line max-len
      contests.map((values) => fields.reduce((acc, field, i) => ({ ...acc, [field]: values[i] }), {})),
    );

    res.send();

    // Create user "dev"
    // ALREADY TESTED
    // await db.del('users', { username: 'dev' });
    // await db.insert('users', [{ username: 'dev', contest_reminders: true, moderator: false }]);

    // FUTURE: contest_categories
    // FUTURE: submission entry
    // FUTURE: voting flags (dev user 2)
    // FUTURE: results flags (dev user 2)
  } catch (err) {
    console.log('reset error: ', err)
    // logger.error(`Error (re)setting /vote: ${err}`);
    res.status(500).send();
  }
};
*/