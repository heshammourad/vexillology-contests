/*
  Easier to refresh entire dev entry instead of upsert/update the dates
  ??? What is the removed column for in entries?
*/

const {
  add,
  format,
  sub,
} = require('date-fns');

const db = require('../db');
const { createLogger } = require('../logger');

const VOTE_MAX = 5;

const logger = createLogger('API/DEV');

const getDevContest = (status) => {
  const contestStatuses = ['prerelease', 'reset', 'submission', 'review', 'voting', 'results'];
  const contestIndex = contestStatuses.indexOf(status);
  const isAfter = (lastStatus) => contestIndex > contestStatuses.indexOf(lastStatus);

  const now = new Date();
  const yearEnd = format(now, 'MM') === 12; // or format(NOW, 'MMM') === 'Dec'
  const pastest = sub(now, { years: 5, months: 1 });
  const past = sub(now, { years: 5 });
  const future = add(now, { years: 5 });
  const futurest = add(now, { years: 5, months: 1 });

  /*
                s_start   s_end     v_start   v_end
    prerelease  future    futurest  future    futurest
    submission  pastest   futurest  future    futurest
    review      pastest   past      future    futurest
    voting      pastest   past      pastest   futurest
    results     pastest   past      pastest   past
  */

  return {
    id: 'dev', // character varying
    name: status === 'reset' ? 'submission' : status, // character varying
    date: now, // date
    env_level: 'dev', // env_level
    year_end: yearEnd, // boolean
    winners_thread_id: null, // character varying
    valid_reddit_id: false, // boolean
    submission_start: isAfter('prerelease') ? pastest : future, // timestamp with time zone
    submission_end: isAfter('submission') ? past : futurest, // timestamp with time zone
    vote_start: add((isAfter('review') ? pastest : future), { seconds: 2 }), // timestamp with time zone
    vote_end: add((isAfter('voting') ? past : futurest), { seconds: 2 }), // timestamp with time zone
    subtext: 'Dev subtext', // character varying
    local_voting: true, // boolean
    prompt: 'This is the prompt for the development contest.', // character varying
  };
};

const CASTINGS = {
  id: '?id',
  date: 'date',
  env_level: 'env_level',
  submission_start: 'timestamp',
  submission_end: 'timestamp',
  vote_start: 'timestamp',
  vote_end: 'timestamp',
};

exports.contest = async ({ body: { status }, username }, res) => {
  try {
    const isExisting = (await db.any("SELECT EXISTS (SELECT 1 FROM contests WHERE id='dev')"))[0].exists;

    if (status === 'reset') {
      /*
        ------- CONTEST -------
        Create a dev contest ONLY if it doesn't exit already
        Reset should not change contest timestamps to avoid changing status
      */
      if (!isExisting) {
        await db.insert('contests', [getDevContest(status)]);
      }

      /*
        ------- DELETE OLD DATA -------
        Ensures developer account is in dev database
        Create a fake "dev" user
      */
      await db.del('votes', { contest_id: 'dev' });
      await db.del('contest_entries', { contest_id: 'dev' });
      await db.any("DELETE FROM entries WHERE id LIKE 'dev-%';");
      await db.del('contest_categories', { contest_id: 'dev' });

      /*
        ------- CONTEST_CATEGORIES -------
        Create categories for dev contest
      */
      const categories = [{ contest_id: 'dev', category: 'cat1' }, { contest_id: 'dev', category: 'cat2' }];
      await db.insert('contest_categories', categories);

      /*
        ------- USERS -------
        Ensures developer account is in dev database
        Create a fake "dev" user
      */
      const users = await db.select('SELECT username FROM users');
      if (!users.some((user) => user.username === username)) {
        await db.insert('users', [{ username, contest_reminders: true, moderator: true }]);
        users.push({ username });
      }
      if (!users.some((user) => user.username === 'dev')) {
        await db.insert('users', [{ username: 'dev', contest_reminders: true, moderator: false }]);
        users.push({ username: 'dev' });
      }

      /*
        ------- ENTRIES -------
        Create some flags for yourself and dev user
        Adjust as desired
        NOTE: borrows flags from existing entires but overrides key data
              accurate url, width, height
              diversity of images, descriptions, etc
      */
      let entryVersions = [
        { user: 'dev', name: 'Pending example', submission_status: 'pending' },
        { user: 'dev', name: 'Withdrawn example', submission_status: 'withdrawn' },
        {
          user: 'dev', name: 'Approved example', submission_status: 'approved', modified_by: 'VertigoOne',
        },
        {
          user: 'dev', name: 'Rejected example', submission_status: 'rejected', modified_by: 'VertigoOne', rejection_reason: 'Rejected because.',
        },
        { user: username, name: 'Pending example', submission_status: 'pending' },
        { user: username, name: 'Withdrawn example', submission_status: 'withdrawn' },
        {
          user: username, name: 'Approved example', submission_status: 'approved', modified_by: 'VertigoOne',
        },
        {
          user: username, name: 'Rejected example', submission_status: 'rejected', modified_by: 'VertigoOne', rejection_reason: 'Rejected because.',
        },
      ];

      const backgroundColors = (await db.select('SELECT * FROM background_colors')).map((obj) => obj.color);
      // add sequential dev# for id (NOTE: zero-indexed, can do i+1 if desired)
      entryVersions = entryVersions.map((v, i) => ({ ...v, id: `dev-${i}`, background_color: backgroundColors[i % 3] }));

      const existingEntries = await db.select(`SELECT width, height, url FROM entries WHERE height > 600 AND url LIKE '%firebasestorage%' LIMIT ${entryVersions.length}`);
      await db.insert('entries', entryVersions.map((version, i) => ({
        ...existingEntries[i], ...version,
      })));

      /*
        ------- CONTEST_ENTRIES -------
        Connect the two
      */
      await db.insert('contest_entries', entryVersions.map(({ id }, i) => ({
        contest_id: 'dev',
        entry_id: id,
        rank: null,
        category: categories[i % categories.length].category, // alternating entries
      })));

      /*
        ------- VOTES -------
        Random voting, all users on all flags
      */
      const approvedEntries = entryVersions.filter((version) => version.submission_status === 'approved');

      await db.insert('votes', users.flatMap(({ username: u }) => (
        approvedEntries.map(({ id }) => ({
          username: u,
          entry_id: id,
          contest_id: 'dev',
          rating: u === approvedEntries.user
            ? VOTE_MAX
            : Math.floor(Math.random() * (VOTE_MAX + 1)),
          last_modified: new Date(),
        }))
      )));
    } else {
      const contest = getDevContest(status);
      // Switch contest status
      if (isExisting) {
        await db.update('contests', [contest], Object.keys(contest).map((key) => {
          if (key === 'id') {
            return '?id';
          }
          return { name: key, cast: CASTINGS[key] };
        }));
      } else {
        await db.insert('contests', [contest]);
      }
    }

    res.send();
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
    logger.error(`Error toggling /mod: ${err}`);
    res.status(500).send();
  }
};
