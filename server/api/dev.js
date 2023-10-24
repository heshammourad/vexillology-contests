/*
  Easier to refresh entire dev entry instead of upsert/update the dates
  ??? What is the removed column for in entries?
*/

const db = require('../db');
const { createLogger } = require('../logger');

const NOW = new Date();
const VOTE_MAX = 5;
const BACKGROUND_COLORS = ['#000', '#FFF', '#4b91e3'];

const logger = createLogger('API/DEV');

const getDevContest = (status) => {
  const contestStatuses = ['prerelease', 'reset', 'submission', 'review', 'voting', 'results'];
  const contestIndex = contestStatuses.indexOf(status);
  const isAfter = (lastStatus) => contestIndex > contestStatuses.indexOf(lastStatus);

  const yearEnd = NOW.getMonth() === 11; // getMonth is zero-based
  const date = NOW.toISOString().split('T')[0];
  const fiveYears = 1000 * 60 * 60 * 24 * 365 * 5;
  const pastest = new Date(NOW.getTime() - fiveYears - 1).toISOString();
  const past = new Date(NOW.getTime() - fiveYears).toISOString();
  const future = new Date(NOW.getTime() + fiveYears).toISOString();
  const futurest = new Date(NOW.getTime() + fiveYears + 1).toISOString();

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
      await db.any("DELETE FROM entries WHERE id LIKE 'dev%';");
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
        Adust as desired
        NOTE: borrows flags from existing entires but overrides key data
              accurate url, width, height
              diversity of images, descriptions, etc
      */
      let entryVersions = [
        { user: 'dev', name: 'Pending (dev)', submission_status: 'pending' },
        { user: 'dev', name: 'Withdrawn (dev)', submission_status: 'withdrawn' },
        {
          user: 'dev', name: 'Approved (dev)', submission_status: 'approved', modified_by: 'VertigoOne',
        },
        {
          user: 'dev', name: 'Rejected (dev)', submission_status: 'rejected', modified_by: 'VertigoOne', rejection_reason: 'Rejected because.',
        },
        { user: username, name: 'Pending (dev)', submission_status: 'pending' },
        { user: username, name: 'Withdrawn (dev)', submission_status: 'withdrawn' },
        {
          user: username, name: 'Approved (dev)', submission_status: 'approved', modified_by: 'VertigoOne',
        },
        {
          user: username, name: 'Rejected (dev)', submission_status: 'rejected', modified_by: 'VertigoOne', rejection_reason: 'Rejected because.',
        },
      ];

      // add sequential dev# for id (NOTE: zero-indexed, can do i+1 if desired)
      entryVersions = entryVersions.map((v, i) => ({ ...v, id: `dev${i}`, background_color: BACKGROUND_COLORS[i % 3] }));

      const existingEntries = await db.select(`SELECT width, height, url FROM entries WHERE height > 600 AND POSITION('https://firebasestorage.googleapis.com' IN url) > 0 LIMIT ${entryVersions.length}`);
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
          last_modified: NOW,
        }))
      )));
    } else {
      const contest = getDevContest(status);
      // Switch contest status
      if (isExisting) {
        // update rejects date for some reason
        // await db.update('contests',
        // [contest], Object.keys(contest).map((key) => (key === 'id' ? '?id' : key)));
        await db.any(`UPDATE contests
          SET
            name = '${contest.name}',
            date = '${contest.date}',
            year_end = ${contest.year_end},
            submission_start = '${contest.submission_start}',
            submission_end = '${contest.submission_end}',
            vote_start = '${contest.vote_start}',
            vote_end = '${contest.vote_end}'
          WHERE id = 'dev';`);
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
