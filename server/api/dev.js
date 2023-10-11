/*
TO DO
determine why DevBar mutate does not fetch new mod status (maybe try a separate mutate button just to check that mechanism in isolation
  NOTE!!! you will be applying same method to the RESET
Test devContests
Eliminate a lot of the VIEW_VOTING / VIEW_SUBMISSION
Consider adding categories, entries for review, entries for voting, entries for results
Function to control moderator (may require creating user)
*/

const db = require('../db');
const { createLogger } = require('../logger');

const logger = createLogger('API/CONTEST');

// Upsert was too verbose, just delete and recreate
exports.reset = async (req, res) => {
  try {
    // Create user "dev"
    await db.del('users', { username: 'dev' });
    await db.insert('users', [{ username: 'dev', contest_reminders: true, moderator: true }]);

    // Create and populate table contests_dev
    /*
    const devContests = 'contests_dev';
    await db.none(`DROP TABLE ${devContests}`);
    await db.none(`CREATE TABLE ${devContests} (
      id character varying NOT NULL,
      name character varying NOT NULL,
      date date,
      env_level 'dev',
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

    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const oneYear = 1000 * 60 * 60 * 24 * 365;
    const pastest = new Date(now.getTime() - oneYear - 1);
    const past = new Date(now.getTime() - oneYear);
    const future = new Date(now.getTime() - oneYear);
    const futurest = new Date(now.getTime() - oneYear + 1);

    await db.insert(devContests, [
      ('prerelease', 'Prerelease', date, 'dev', false, null, true, future, futurest, 'Prelease subtext', true, future, futurest, 'Prerelease prompt'),
      ('review', 'Review', date, 'dev', false, null, true, future, futurest, 'Review subtext', true, pastest, past, 'Review prompt'),
      ('voting', 'Voting', date, 'dev', false, null, true, pastest, futurest, 'Voting subtext', true, pastest, past, 'Voting prompt'),
      ('results', 'Results', date, 'dev', false, null, true, pastest, past, 'Results subtext', true, pastest, past, 'Results prompt'),
    ]);
    */

    // FUTURE: contest_categories
    // FUTURE: submission entry
    // FUTURE: voting flags (dev user 2)
    // FUTURE: results flags (dev user 2)
  } catch (err) {
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
    logger.error(`Error (re)setting /vote: ${err}`);
    res.status(500).send();
  }
};
