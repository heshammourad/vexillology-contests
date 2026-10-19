# Database changes

There are no migrations here. The schema is changed directly against the database, and this folder
holds those changes as files, so a PR can carry one for review.

- Name each file `YYYYMMDD-<slug>.sql`, one per change.
- Use **unqualified** names (no `vexillology_contests.` prefix), so the same file runs against
  every schema with only the search path changed.
- Make it safe to run twice where Postgres allows it (`CREATE OR REPLACE`, `IF NOT EXISTS`).

They are applied by hand, in this order:

1. To `vexillology_contests_staging` (`SET search_path TO vexillology_contests_staging, vexillology_contests_common;`)
   before the PR merges, if the code needs the change at deploy time. Otherwise right after it merges.
2. To `vexillology_contests` before staging is promoted to production.

Then regenerate `../schema.sql` with `npm run dump-schema`, and commit it.
