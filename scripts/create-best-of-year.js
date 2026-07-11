#!/usr/bin/env node
/**
 * Year-end "Best of YYYY" contest helper.
 *
 * Candidates come from the `best_of_year` view (current calendar year):
 *   - top entry from each designer in the annual top 30
 *   - top 3 entries per monthly contest
 *   (union; usually ~50, theoretical max ~66)
 *
 * Usage:
 *   npm run best-of                         # preview candidates
 *   npm run best-of -- --create             # create best{YY} + add entries
 *   npm run best-of -- 2026 --create        # same, explicit year
 *   npm run best-of -- --refresh            # add any missing entries to existing contest
 *   npm run best-of -- --create --prompt "Your prompt markdown"
 *
 * Note: `best_of_year` always filters by the DB's current year (now()).
 * Run create/refresh in December of the year you are closing out.
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('pg-connection-string');
const pgp = require('pg-promise')();

const loadEnvFile = () => {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }

    const eq = trimmed.indexOf('=');
    if (eq === -1) {
      return;
    }

    const key = trimmed.slice(0, eq);
    let value = trimmed.slice(eq + 1);
    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
};

const parseArgs = (argv) => {
  const args = {
    create: false,
    refresh: false,
    year: null,
    prompt: null,
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--create') {
      args.create = true;
    } else if (arg === '--refresh') {
      args.refresh = true;
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--prompt') {
      args.prompt = argv[i + 1];
      i += 1;
    } else if (/^\d{4}$/.test(arg)) {
      args.year = Number(arg);
    } else {
      console.error(`Unknown argument: ${arg}`);
      args.help = true;
    }
  }

  return args;
};

const printHelp = () => {
  console.log(`Year-end Best of contest helper

Usage:
  npm run best-of                         Preview candidates from best_of_year
  npm run best-of -- --create             Create best{YY} and populate entries
  npm run best-of -- 2026 --create        Create for an explicit year
  npm run best-of -- --refresh            Add missing candidates to existing contest
  npm run best-of -- --create --prompt "..."

The best_of_year view always uses the current calendar year.`);
};

const contestIdForYear = (year) => `best${String(year).slice(-2)}`;

const defaultPrompt = (year) => `Best of ${year} — vote for your favorite flags from this year's contests.`;

const printCandidates = (rows) => {
  console.log(`\n${rows.length} candidate entries in best_of_year:\n`);
  rows.forEach((row, index) => {
    const avg = row.average ?? '—';
    console.log(
      `${String(index + 1).padStart(3)}. ${avg}  ${row.user}  |  ${
        row.contest_name
      }  |  ${row.entry_name}  (${row.entry_id})`,
    );
  });
};

const main = async () => {
  loadEnvFile();

  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const { DATABASE_URL, DATABASE_SCHEMA, DATABASE_SSL } = process.env;
  if (!DATABASE_URL) {
    console.error('DATABASE_URL is not set. Ensure .env is present.');
    process.exit(1);
  }

  const schema = DATABASE_SCHEMA || 'public';
  const db = pgp({
    ...parse(DATABASE_URL),
    ssl: DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    await db.none('SET search_path TO $1', [schema]);

    const currentYear = Number(
      (await db.one('SELECT EXTRACT(YEAR FROM CURRENT_DATE)::int AS year'))
        .year,
    );
    const year = args.year ?? currentYear;
    const contestId = contestIdForYear(year);

    if (year !== currentYear) {
      console.warn(
        `\nWarning: requested year ${year} but best_of_year is filtered to ${currentYear} (now()).`,
      );
      console.warn(
        "Create/refresh will attach the CURRENT year's candidates to that contest id.\n",
      );
    }

    const candidates = await db.any(
      'SELECT * FROM best_of_year ORDER BY average DESC NULLS LAST',
    );
    printCandidates(candidates);

    const existing = await db.oneOrNone(
      'SELECT id, name, date, year_end FROM contests WHERE id = $1',
      [contestId],
    );

    if (existing) {
      const linked = await db.one(
        'SELECT COUNT(*)::int AS n FROM contest_entries WHERE contest_id = $1',
        [contestId],
      );
      console.log(
        `\nContest ${contestId} already exists (${existing.name}) with ${linked.n} entries.`,
      );
    } else {
      console.log(`\nContest ${contestId} does not exist yet.`);
    }

    if (!args.create && !args.refresh) {
      console.log(
        '\nDry run only. Pass --create or --refresh to make changes.',
      );
      return;
    }

    if (args.create) {
      if (existing) {
        console.error(
          `\nRefusing to create: ${contestId} already exists. Use --refresh to add missing entries.`,
        );
        process.exit(1);
      }

      const prompt = args.prompt || defaultPrompt(year);
      const contestDate = `${year}-12-23`;
      const subStart = `${year}-11-30 21:00:00`;
      const subEnd = `${year}-12-16 21:00:00`;
      const voteStart = `${year}-12-23 21:00:00`;
      const voteEnd = `${year}-12-27 21:00:00`;

      // Mirrors create_best_of_year_contest, but supplies a non-empty prompt
      // (add_contest rejects NULL/empty prompts).
      await db.none(
        `SELECT add_contest(
          p_name := $1,
          p_date := $2,
          p_prompt := $3,
          p_id := $4,
          p_year_end := TRUE,
          p_submission_start := ($5::timestamp AT TIME ZONE 'America/Los_Angeles'),
          p_submission_end := ($6::timestamp AT TIME ZONE 'America/Los_Angeles'),
          p_vote_start := ($7::timestamp AT TIME ZONE 'America/Los_Angeles'),
          p_vote_end := ($8::timestamp AT TIME ZONE 'America/Los_Angeles'),
          p_categories := NULL
        )`,
        [
          `Best of ${year}`,
          contestDate,
          prompt,
          contestId,
          subStart,
          subEnd,
          voteStart,
          voteEnd,
        ],
      );

      console.log(`\nCreated contest ${contestId}.`);
    }

    if (args.create || args.refresh) {
      if (!args.create) {
        const stillMissing = await db.oneOrNone(
          'SELECT id FROM contests WHERE id = $1',
          [contestId],
        );
        if (!stillMissing) {
          console.error(
            `\nContest ${contestId} does not exist. Use --create first.`,
          );
          process.exit(1);
        }
      }

      const inserted = await db.any(
        `INSERT INTO contest_entries (contest_id, entry_id)
         SELECT $1, entry_id
         FROM best_of_year
         ON CONFLICT (contest_id, entry_id) DO NOTHING
         RETURNING entry_id`,
        [contestId],
      );

      const total = await db.one(
        'SELECT COUNT(*)::int AS n FROM contest_entries WHERE contest_id = $1',
        [contestId],
      );

      console.log(
        `Linked ${inserted.length} new entr${
          inserted.length === 1 ? 'y' : 'ies'
        } (contest now has ${total.n}).`,
      );
    }
  } finally {
    await pgp.end();
  }
};

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
