# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Vexillology Contests (vexillologycontests.com) — a website to view and vote on r/vexillology flag design contest entries. Reddit is the identity provider (via `snoowrap`); PostgreSQL is the data store; Firebase is used for image upload tokens.

The repo is two independent npm projects that must each be installed/run separately:

1. **Node/Express API server** at the repo root (`server/`, entry `server/index.js`)
2. **React UI** in `react-ui/` (Create React App, entry `react-ui/src/index.js`)

In dev, the React dev server (port 3000) proxies API calls to the Express server (port 5000) via the `proxy` field in `react-ui/package.json`. In production, Express serves the built React bundle as static files and falls back to `index.html` for client-side routing.

## Commands

### Root (server)

- `npm install` — install server deps
- `npm start` — start the Express server (`node server`)
- `npm run build` — installs and builds the React UI (`cd react-ui && npm install && npm run build`); this is what Heroku runs
- `npm run heroku` — run via `heroku local` with nodemon, for testing Procfile/env behavior locally

### react-ui

Run these from inside `react-ui/`:

- `npm install` — install UI deps
- `npm start` — start CRA dev server on port 3000 (proxies `/api` to port 5000)
- `npm run build` — production build to `react-ui/build`
- `npm test` — CRA/Jest test runner (interactive watch mode by default)
- `npm run lint` / `npm run lint-fix` — ESLint over `src/**/*.js{,x}`

There is no top-level test command for the server package; tests live only in the React UI (CRA/Jest, minimal coverage — mostly smoke-level).

### Git workflow

- Direct commits to `master` are blocked by a Husky pre-commit hook; work on a feature branch and go through a PR.
- Pre-commit runs `lint-staged`: `prettier-eslint --write` + `eslint --fix` on staged `.js`/`.jsx`, `prettier --write` on everything else.

## Environment configuration

Two layers of config, both gitignored and templated:

1. **`.env`** (root) — copy from `.env.template`. Drives DB connection (`DATABASE_URL`, `DATABASE_SCHEMA`, `DATABASE_SSL`), Reddit/snoowrap credentials, Firebase, Memcache, and `ENV_LEVEL` (`dev`/`staging`/`prod` — gates which rows of the `contests` table are visible: `dev` sees all, `staging` sees staging+prod, `prod` sees only prod).
2. **`env.js`** — two separate files, `server/env.js` and `react-ui/src/env.js`, each created by copying the sibling `env.template.js`. These process `.env`/build-time variables into typed config and hold developer-only flags (e.g. `IS_UNAUTHENTICATED_VIEW`, `ALLOW_DEV_CONTEST`, `IGNORE_PENDING_DEV` in `server/env.js`) that must default to falsy/production behavior so an uncommitted local change never leaks. `server/env.js` also loads an optional gitignored `server/env.personal.js` (`MY_DEV_VARIABLES`) so each developer can flip the flags above (e.g. `ALLOW_DEV_CONTEST`) on locally without committing a change to `server/env.js`.

If you add a new required env var, update the corresponding `env.template.js` with the production-safe default and call it out in the commit message — other devs' `env.js` won't get it automatically.

## Deployment (Heroku)

The site is hosted on Heroku with a pipeline of two apps/environments:

- **staging** — auto-deploys the latest `master` commit, served at `staging.vexillologycontests.com`. Has autosleep enabled (dyno idles when unused). Connects to the `vexillology_contests_staging` Postgres schema, which is refreshed semi-regularly by copying from prod (see `backup_data`/`copy_contest` below) rather than being continuously in sync.
- **production** — served at `www.vexillologycontests.com`. Promoted manually from staging in Heroku's pipeline UI; promotion is all-or-nothing (whatever is currently deployed on staging), there is no way to promote a subset of commits. Connects to the `vexillology_contests` schema.

Each environment's `DATABASE_SCHEMA` env var (see `server/db/index.js`, which sets it as the `pg-promise` `schema` search-path option) selects which Postgres schema that dyno reads/writes — this is what actually separates staging data from prod data, since both environments share one Postgres instance. This is a different axis from `ENV_LEVEL`/`CONTEST_ENV_LEVEL` (see above), which filters _rows within_ whichever schema is connected by the `contests.env_level` column — so a contest can be flagged `dev`-only, `stage`+, or `prod` independent of which physical schema/environment it lives in.

## Database schema (Postgres)

All schema objects live in the `vexillology_contests` Postgres schema (mirrored in `vexillology_contests_staging` and `vexillology_contests_backup` for the other environments/backups; shared enum types live in `vexillology_contests_common`). There's no migrations folder in this repo — schema changes are made directly against the database (see the wiki link in `docs/Links.md`). `server/db/queries.js` and the various `server/api/*/db.js` files are the best reference for how these are queried from the app.

**Core tables:**

- `contests` — one row per contest (id, name, dates for submission/voting windows, `prompt`, `env_level` (`dev`/`stage`/`prod`, gates visibility per `CONTEST_ENV_LEVEL`), `local_voting`, `min_voter_avg`/`max_voter_avg` (bounds used to decide whether a voter's ballot counts, see `contests_summary` below), `results_certified`, `winners_thread_id`/`valid_reddit_id` for linking back to the Reddit results thread).
- `contest_categories` — categories available within a contest (e.g. multiple prompts in one contest), FK'd to `contests`.
- `entries` — a submitted flag (id, `user` (Reddit username), name, description, image `url`/dimensions, `background_color`, `submission_status` enum (`pending`/`approved`/`rejected`/`withdrawn`), `removed`, `modified_by`).
- `contest_entries` — join table linking an `entry` to the `contest`/`category` it was submitted into, plus final `rank` once results are in.
- `votes` — one row per (contest, entry, voter) rating (0-5), `last_modified`, `is_desktop`/`is_keyed` (client metadata).
- `users` — Reddit username, `moderator` flag, `role_id` (FK to `user_roles`), `karma`, `contest_reminders` opt-in, `excluded_vote_range` (a `datemultirange` of dates during which this user's votes should be excluded, e.g. after a ban).
- `user_roles` — named roles with boolean columns per permission (`review_submissions`, `view_scores`, `disqualify_entries`, `access_fairness_tools`, `participate_in_contest`) — mirrors the `UserPermissions` enum in `server/db/userPermissions.js`.
- `user_bans` / `voter_dqs` / `entry_dqs` — moderation records: banning a user from a contest, disqualifying a voter's ballots, disqualifying an entry, each with a `reason` and moderator attribution.
- `background_colors`, `static_content`, `experiments` — small supporting tables (allowed background colors for entries; CMS-style static page content; feature-flag-style experiment toggles).

**Views/materialized views:**

- `contests_summary` (**materialized view**) — the core scoring aggregate: per-entry vote count/average and rank (overall and within category), computed only from voters whose _own_ average rating for the contest falls within that contest's `min_voter_avg`/`max_voter_avg` bounds (a fairness/anti-brigading filter) and excluding any date covered by that voter's `excluded_vote_range`, restricted to contests where `vote_end < now()`. This is **not** auto-refreshed by a trigger — the app calls `refreshContestsSummaryView()` (`server/db/queries.js`) which tries `REFRESH MATERIALIZED VIEW CONCURRENTLY` and falls back to a blocking `REFRESH` if that fails (e.g. no unique index yet). Called from `manageContest.js` after moderator actions like certifying results.
- `annual_standings` — per-user leaderboard for the current calendar year, summed/averaged from `contests_summary`, broken out by month.
- `best_of_year` — each top-30 annual-standings user's single best entry of the year, plus every contest's top-3 finishers; feeds the "Best of Year" contest.
- `hall_of_fame` — all-time list of first-place finishers per contest (from `contest_entries.rank = 1`, or from `contests_summary` for `local_voting` contests), used by the Hall of Fame page.

**Key functions (called from `server/db/`):**

- `has_user_permission(username, permission)` — used by `requireRole` middleware to check a user's role against `user_roles`.
- `add_contest(...)` — creates a new contest + categories; backs the moderator "Add Contest" page/endpoint (`react-ui/src/pages/mod/addContest/AddContest.jsx`, `server/api/addContest.js`).
- `get_contest_results(contestId, excludedUsernames)` — returns full per-entry results (rank, votes, average, per-rating-value counts) for the moderator contest-summary/analysis tools, with the ability to exclude specific usernames' votes for what-if analysis.
- `copy_contest(id)` — copies one contest + its categories from the prod schema into `vexillology_contests_staging`, for testing a real contest's data in staging.
- `backup_data(dest_schema, truncate)` — generic cross-schema sync: copies `user_roles`, `users`, `background_colors`, `contests`, `contest_categories`, `entries`, `contest_entries`, `votes` from the current schema into `dest_schema` (upserting on primary key), then refreshes every materialized view in `dest_schema`. This is the mechanism behind staging's periodic refresh from prod.
- `create_best_of_year_contest(year)` — builds the annual "Best of \<year\>" contest by calling `add_contest` with a fixed December schedule and seeding its entries from the `best_of_year` view.
- `update_vote_timestamp()` — trigger function that stamps `votes.last_modified` on write.

## Backend architecture (`server/`)

- `index.js` — app bootstrap. Uses Node `cluster` to fork one worker per CPU in production (skipped in dev). Sets up `helmet` CSP, redirects the old Heroku domain / non-HTTPS to `https://www.vexillologycontests.com`, rate-limits `/api` (100 req/min), and defines three route groups:
  - `apiRouter` (`/api/...`) — public + authenticated user endpoints (contests, votes, submissions, settings, hall of fame, etc.)
  - `modRouter` (`/api/mod/...`) — moderator-only, gated by `requireModerator` on all routes
  - `imageRouter` (`/i/...`) — CORS-open image serving
  - Dev-only routes (`/api/dev/*`) are mounted only when `IS_DEV`.
- `api/` — one file per resource/endpoint, exporting Express handlers (`get`/`put`/`post`/`delete`); business logic mostly lives here rather than in `index.js`.
- `api/authentication.js` — middleware factory functions consumed by `index.js` route definitions:
  - `processUser(checkModerator)` — best-effort: attaches `req.username`/`req.userAttributes` (and `req.moderator`) if Reddit tokens are present, never blocks the request.
  - `requireAuthentication` — 401s if `accesstoken`/`refreshtoken` headers are missing or invalid. Auth is header-based (no cookies/sessions) — the client sends Reddit OAuth tokens on every request.
  - `requireModerator` — `requireAuthentication` + DB check against `users.moderator`.
  - `requireRole(role)` — `requireAuthentication` + `has_user_permission($1, $2)` Postgres function check; roles are the `UserPermissions` enum (`server/db/userPermissions.js`): `access_fairness_tools`, `disqualify_entries`, `review_submissions`, `participate_in_contest`, `view_scores`.
  - `validation.js` exports `checkRequiredFields(...)`, used as route middleware to 400 on missing body fields.
- `db/index.js` — thin `pg-promise` wrapper exporting `select`/`insert`/`update`/`del`/`any`/`none`. Automatically camelizes returned column names (`receive` hook). `DATABASE_SCHEMA` from `.env` sets the Postgres search path. Prefer these helpers over raw `pgp` calls; `db/queries.js` holds larger/shared SQL.
- `reddit.js` — snoowrap wrapper for Reddit API/OAuth (user lookup, token refresh).
- `firebase.js` / `imgur.js` — third-party integrations (upload tokens; legacy Imgur reads for old contest data).
- `logger.js` — Winston logger factory (`createLogger(label, opts)`), level from `LOG_LEVEL` env var.
- Database schema itself lives outside this repo — see the wiki (linked from `docs/Links.md`), not in a migrations folder here.

## Frontend architecture (`react-ui/src/`)

- `App.jsx` — theme (`CustomThemeProvider`), global `SWRConfig` (fetcher = `getData` from `data/api.js`, no revalidate-on-focus/reconnect), and all `react-router-dom` v6 routes. Entry modals are nested routes (e.g. `/contests/:contestId/entry/:entryId` renders `EntryModal` over `Contest`) — see the `react-router` v5 modal pattern referenced in a comment there.
- `pages/` — one folder per route/page; `pages/index.js` re-exports the top-level page components used by `App.jsx`. Mod-only pages (`pages/mod/...`) are imported directly rather than through the barrel (flagged with `eslint-disable no-restricted-imports` in `App.jsx`).
- `components/` — reusable/presentational pieces shared across pages.
- `data/` — all server communication and SWR hooks:
  - `api.js` — raw `axios` wrappers (`getData`/`postData`/`putData`/`deleteData`), baseURL `/api`. Auth tokens are passed explicitly per-call as headers, not stored in axios defaults.
  - `useSwr*.jsx` hooks (`useSwrContest`, `useSwrInit`, `useSwrModReview`, etc.) wrap `useSWR`/`useSWRMutation` for each endpoint — always fetch through these (or `useSwrMutation`), never call `data/api.js` directly from components, per `docs/Frontend.md`.
- `common/` — cross-cutting hooks/state (`useAuthState`, `useSettingsState`, `useRedditLogIn`, `firebase.js`, style hooks) and shared type/enum modules (`countdownTypes.js`, `snackbarTypes.js`, `types.js`).
- `images/` — static site assets.
- UI is a mix of MUI v4 (`@material-ui/core`) and MUI v5 (`@mui/material`) — both are present in `package.json`; check which a given file already imports before adding new components, don't mix within one component.

## Auth model

Reddit OAuth is the only identity provider. The client obtains `accesstoken`/`refreshtoken` (see `useAuthState`, `AuthorizeCallback` page, `server/api/accessToken.js`, `server/api/revokeToken.js`) and sends them as request headers on every authenticated call — there is no server-side session/cookie. Moderator status and per-user permissions are looked up from Postgres (`users.moderator`, `has_user_permission()`), keyed by Reddit username.
