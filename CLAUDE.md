# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Vexillology Contests (vexillologycontests.com) — a website to view and vote on r/vexillology flag design contest entries. Reddit is the identity provider (via `snoowrap`); PostgreSQL is the data store; Firebase is used for image upload tokens.

The repo is two independent npm projects that must each be installed/run separately:

1. **Node/Express API server** at the repo root (`server/`, entry `server/index.js`)
2. **React UI** in `react-ui/` (Create React App, entry `react-ui/src/index.js`)

In dev, the React dev server (port 3000) proxies API calls to the Express server (port 5000) via `react-ui/src/setupProxy.js` (for `/api` and `/i`), which returns a 503 instead of a proxy error while the backend is restarting. In production, Express serves the built React bundle as static files and falls back to `index.html` for client-side routing.

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

There is no top-level test command for the server package. The only test is react-ui's `App.test.js` smoke test, and it fails on master before reaching an assertion (Jest can't parse ESM-only `nanoid`; with that fixed, Plotly can't load in jsdom), so CI doesn't run it. Tests are left to the Next.js migration.

### CI

`.github/workflows/ci.yml` runs on every PR and on `master`: `npx eslint server --max-warnings=0`, `npm run lint -- --max-warnings=0` in `react-ui/`, and `CI=false npm run build` in `react-ui/`. Run the same before pushing. `CI=false` matches Heroku's build; with `CI=true`, CRA turns the expected warning from `env.js`'s optional `require('./env.personal')` into an error. `claude-pr-review.yml` also posts a Claude review on non-bot PRs.

### Git workflow

- Direct commits to `master` are blocked by a Husky pre-commit hook; work on a feature branch and go through a PR.
- Pre-commit runs `lint-staged`: `prettier-eslint --write` + `eslint --fix` on staged `.js`/`.jsx`, `prettier --write` on everything else.

## Environment configuration

Two layers of config:

1. **`.env`** (root) — copy from `.env.template`. Drives DB connection (`DATABASE_URL`, `DATABASE_SCHEMA`, `DATABASE_SSL`), Reddit/snoowrap credentials, Firebase, and `ENV_LEVEL` (`dev`/`staging`/`prod` — gates which rows of the `contests` table are visible: `dev` sees all, `staging` sees staging+prod, `prod` sees only prod).
2. **`env.js`** — two separate, **committed** files, `server/env.js` and `react-ui/src/env.js`. These process `.env`/build-time variables into typed config and hold developer-only flags (e.g. `IS_UNAUTHENTICATED_VIEW`, `ALLOW_DEV_CONTEST`, `IGNORE_PENDING_DEV` in `server/env.js`) that must default to falsy/production behavior so an uncommitted local change never leaks. Each also loads an optional gitignored `env.personal.js` beside it (`MY_DEV_VARIABLES`), created by copying the sibling `env.template.js`, so each developer can flip the flags above (e.g. `ALLOW_DEV_CONTEST`) on locally without committing a change to `env.js`.

Optionally, **`react-ui/.env.development.local`** (gitignored, read by CRA only for `npm start`, never `npm run build`) can set `REACT_APP_APPCHECK_DEBUG_TOKEN`. Don't use `.env.local` for it: CRA inlines every `REACT_APP_*` variable into production builds too. reCAPTCHA v3 doesn't work on localhost, so dev builds use Firebase App Check's debug provider (`react-ui/src/common/firebase.js`). Register a debug token in the Firebase console (App Check → Apps → Manage debug tokens) and put it here to share it across browsers. Without it, the SDK generates a per-browser token and logs it to the console for registration. Until a registered token is in use, every App Check refresh fails, and each failure surfaces as an `Uncaught (in promise) cancelled` runtime-error overlay. Restart `npm start` after changing it.

If you add a new developer flag, give it a falsy, production-safe default in `env.js`, add it to the sibling `env.template.js` as an example, and call it out in the commit message, since other devs' `env.personal.js` won't get it automatically. A new `.env` variable goes in `.env.template`.

## Deployment (Heroku)

The site is hosted on Heroku with a pipeline of two apps/environments:

- **staging** — auto-deploys the latest `master` commit, served at `staging.vexillologycontests.com`. Has autosleep enabled (dyno idles when unused). Connects to the `vexillology_contests_staging` Postgres schema, which is refreshed semi-regularly by copying from prod (see `backup_data`/`copy_contest` below) rather than being continuously in sync.
- **production** — served at `www.vexillologycontests.com`. Promoted manually from staging in Heroku's pipeline UI; promotion is all-or-nothing (whatever is currently deployed on staging), there is no way to promote a subset of commits. Connects to the `vexillology_contests` schema.

Each environment's `DATABASE_SCHEMA` env var (see `server/db/index.js`, which sets it as the `pg-promise` `schema` search-path option) selects which Postgres schema that dyno reads/writes — this is what actually separates staging data from prod data, since both environments share one Postgres instance. This is a different axis from `ENV_LEVEL`/`CONTEST_ENV_LEVEL` (see above), which filters _rows within_ whichever schema is connected by the `contests.env_level` column — so a contest can be flagged `dev`-only, `stage`+, or `prod` independent of which physical schema/environment it lives in.

## Milestones and tracking issues

Work is grouped into milestones, which are **sequential goals** (adopted 2026-10-18). An issue holds at most one milestone, and an issue with no milestone is deliberately not needed for any current goal. Milestones give open/closed counts but no ordering, so each one has a **tracking issue** (label `tracking`) whose checklist orders it:

1. [Manage contests](https://github.com/heshammourad/vexillology-contests/milestone/1): #561
2. [Year-end contest](https://github.com/heshammourad/vexillology-contests/milestone/2): #562
3. [Contest summary history](https://github.com/heshammourad/vexillology-contests/milestone/3): #563
4. [Next.js migration](https://github.com/heshammourad/vexillology-contests/milestone/4): #564
5. [Backlog](https://github.com/heshammourad/vexillology-contests/milestone/5): #565, in the stack-rank order of Hesham's task spreadsheet

When you open, close or reprioritise a milestoned issue, edit its tracker's checklist in the same action (`gh issue edit <tracker> --body-file -`). A checklist that has drifted from reality is worse than none, because Autopilot picks from it. `- [ ] #N` lines are work to pick; plain `- #N` bullets (like #564's deferred CRA cleanups) are context and never picked. `gh` has no `milestone` subcommand: create and list milestones with `gh api repos/heshammourad/vexillology-contests/milestones`, assign with `gh issue edit N --milestone "<title>"`, and link one from an issue body by its absolute URL.

## Autopilot

Claude works the trackers unattended in GitHub Actions, at Hesham's pace (added 2026-10-18, modeled on the same loop in `expenses-tracker`). It plans the next tracker item on its issue, builds it on `@claude go`, answers `@claude` review comments on the PR, and once the merge is live on staging, checks it and plans the next item. **The loop and its rules are in `.claude/AUTOPILOT.md`**, which is what the runs themselves read. It sits under `.claude/` because a PR run restores that directory from the base branch, so a PR can't rewrite the rules it is reviewed under.

- **`autopilot.yml`**: triggered by Heroku's `success` deployment status for `vexillology-contests-staging`, relayed to a `workflow_dispatch` because the action rejects `deployment_status`. A shell step picks the first unchecked line on the lowest-numbered open `tracking` issue whose issue is open, unlabelled `blocked`/`needs-input`/`autopilot`/`by-hand`, and not already claimed by an open PR. Claude then wraps up the PR that just deployed, if it was an `autopilot` one, and plans the picked issue. Production promotion stays manual, and nothing here touches it.
- **`claude.yml`**: `@claude` from the repo owner only, on an issue or a PR. The repo is public, so this gate is what keeps anyone else's comment from starting a run.
- **One item in flight**: any open `autopilot` issue stops the picker. `needs-input` means it's waiting on Hesham, and `blocked` means the picker skips it. `by-hand` marks an issue Hesham is doing by hand, and the picker skips that too (#198, #558). Assignees mean nothing to it, because Hesham is assigned to most open issues out of habit.
- **Stuck picker**: if every staging deploy logs `Not picking: #N is still in flight` but #N has no open PR (its PR closed unmerged, or merged without `Closes #N`), clear it with `gh issue edit N --remove-label autopilot`.
- **Off switch**: the repository variable `AUTOPILOT_ENABLED` must be `true` for anything in `autopilot.yml` to run. `@claude` keeps working when it's off.

**What the runs can reach.** No database. Heroku Postgres `essential-0` can't issue a read-only credential, so the only one is the owner's, and the shared setup action (`.github/actions/setup`, also used by `ci.yml`) fails the job if any Postgres URL is in its environment. Don't wire `DATABASE_URL` or `HEROKU_API_KEY` into these workflows. Runs read the schema from `server/db/schema.sql` and ship changes as `server/db/changes/*.sql`. Auth is the `CLAUDE_CODE_OAUTH_TOKEN` secret plus the Claude GitHub App. Without the App, the action falls back to `GITHUB_TOKEN`, and a PR opened with that token triggers no workflows, so `ci.yml` wouldn't run on Claude's PRs.

## Database schema (Postgres)

All schema objects live in the `vexillology_contests` Postgres schema (mirrored in `vexillology_contests_staging` and `vexillology_contests_backup` for the other environments/backups; shared enum types live in `vexillology_contests_common`). There's no migrations folder in this repo — schema changes are made directly against the database (see the wiki link in `docs/Links.md`). `server/db/schema.sql` is a generated, structure-only snapshot of `vexillology_contests` and `vexillology_contests_common` (`npm run dump-schema`, from `server/db/dumpSchema.js`; never edit it by hand). A change that ships in a PR goes in `server/db/changes/YYYYMMDD-<slug>.sql`, which is applied by hand (staging schema first, production before the promotion; see that folder's README), after which `schema.sql` is regenerated. `server/db/queries.js` and the various `server/api/*/db.js` files are the best reference for how these are queried from the app.

**Moderation internals stay out of this repo.** It's public, so don't write down how ballots are judged, how abuse is detected, or what thresholds exist, here or in any issue, PR, commit message or comment. That covers `contests_summary` and `get_contest_results`, the analyze-votes and ban tooling, and the ballot-validity columns. Local sessions get the details from the gitignored `CLAUDE.local.md`. `server/db/schema.sql` withholds every function and view body that isn't on `dumpSchema.js`'s allowlist.

**Database function or app code** (decided 2026-10-20). Write queries in the app by default (`server/db/queries.js`, `server/api/*/db.js`). There they're versioned, reviewed in PRs and visible to Autopilot, which can't reach the database, and they can't drift between the staging and production schemas the way a hand-applied function can. That goes double for plain selects without many joins or nested queries. Put the logic in a Postgres function or view only when:

- it saves round trips that matter for performance, or
- it's a multi-step write that must be atomic **and** has to run outside the app too (by hand from a SQL console, or from another database function). If only the app runs it, use a transaction in code (pg-promise's `tx`, exported by `server/db/index.js`).

Moderation logic follows the rules in the paragraph above. A function that already exists stays until the work that touches it moves it.

**Core tables:**

- `contests` — one row per contest (id, name, dates for submission/voting windows, `prompt`, `env_level` (`dev`/`stage`/`prod`, gates visibility per `CONTEST_ENV_LEVEL`), `local_voting`, ballot-validity settings, `results_certified`, `winners_thread_id`/`valid_reddit_id` for linking back to the Reddit results thread).
- `contest_categories` — categories available within a contest (e.g. multiple prompts in one contest), FK'd to `contests`.
- `entries` — a submitted flag (id, `user` (Reddit username), name, description, image `url`/dimensions, `background_color`, `submission_status` enum (`pending`/`approved`/`rejected`/`withdrawn`), `removed`, `modified_by`).
- `contest_entries` — join table linking an `entry` to the `contest`/`category` it was submitted into, plus final `rank` once results are in.
- `votes` — one row per (contest, entry, voter) rating (0-5), `last_modified`, `is_desktop`/`is_keyed` (client metadata).
- `users` — Reddit username, `moderator` flag, `role_id` (FK to `user_roles`), `karma`, `contest_reminders` (deprecated opt-in, no longer read by the app; only the dev seed in `server/api/dev.js` still sets it), and moderation state.
- `user_roles` — named roles with boolean columns per permission (`review_submissions`, `view_scores`, `disqualify_entries`, `access_fairness_tools`, `participate_in_contest`) — mirrors the `UserPermissions` enum in `server/db/userPermissions.js`.
- `user_bans` / `voter_dqs` / `entry_dqs` — moderation records: banning a user from a contest, disqualifying a voter's ballots, disqualifying an entry, each with a `reason` and moderator attribution.
- `background_colors`, `static_content`, `experiments` — small supporting tables (allowed background colors for entries; CMS-style static page content; feature-flag-style experiment toggles).

**Views/materialized views:**

- `contests_summary` (**materialized view**) — the core scoring aggregate: per-entry vote count/average and rank (overall and within category), counting only valid ballots, for contests whose voting has ended. This is **not** auto-refreshed by a trigger — the app calls `refreshContestsSummaryView()` (`server/db/queries.js`) which tries `REFRESH MATERIALIZED VIEW CONCURRENTLY` and falls back to a blocking `REFRESH` if that fails (e.g. no unique index yet). Called from `manageContest.js` after moderator actions like certifying results.
- `annual_standings` — per-user leaderboard for the current calendar year, summed/averaged from `contests_summary`, broken out by month.
- `best_of_year` — each top-30 annual-standings user's single best entry of the year, plus every contest's top-3 finishers; feeds the "Best of Year" contest.
- `hall_of_fame` — all-time list of first-place finishers per contest (from `contest_entries.rank = 1`, or from `contests_summary` for `local_voting` contests), used by the Hall of Fame page.

**Key functions (called from `server/db/`):**

- `has_user_permission(username, permission)` — used by `requireRole` middleware to check a user's role against `user_roles`.
- `add_contest(...)` — creates a new contest + categories. Only `create_best_of_year_contest` still calls it: the moderator Manage Contests page (`server/api/modContests/`) inserts in code, in a transaction (`addContest` in `server/api/modContests/db.js`).
- `get_contest_results(...)` — full per-entry results (rank, votes, average, per-rating-value counts) for the moderator contest summary.
- `copy_contest(id)` — copies one contest + its categories from the prod schema into `vexillology_contests_staging`, for testing a real contest's data in staging.
- `backup_data(dest_schema, truncate)` — generic cross-schema sync: copies `user_roles`, `users`, `background_colors`, `contests`, `contest_categories`, `entries`, `contest_entries`, `votes` from the current schema into `dest_schema` (upserting on primary key), then refreshes every materialized view in `dest_schema`. This is the mechanism behind staging's periodic refresh from prod.
- `create_best_of_year_contest(year)` — builds the annual "Best of \<year\>" contest by calling `add_contest` with a fixed December schedule and seeding its entries from the `best_of_year` view.
- `update_vote_timestamp()` — trigger function that stamps `votes.last_modified` on write.

## Backend architecture (`server/`)

- `index.js` — app bootstrap. Uses Node `cluster` to fork one worker per CPU in production (skipped in dev). Sets up `helmet` CSP, redirects the old Heroku domain / non-HTTPS to `https://www.vexillologycontests.com`, rate-limits `/api` (100 req/min), and defines three route groups:
  - `apiRouter` (`/api/...`) — public + authenticated user endpoints (contests, votes, submissions, hall of fame, etc.)
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
- `db/index.js` — thin `pg-promise` wrapper exporting `select`/`insert`/`update`/`del`/`any`/`none`/`tx`. Automatically camelizes returned column names (`receive` hook). `DATABASE_SCHEMA` from `.env` sets the Postgres search path. Prefer these helpers over raw `pgp` calls; `db/queries.js` holds larger/shared SQL.
- `reddit.js` — snoowrap wrapper for Reddit API/OAuth (user lookup, token refresh).
- `firebase.js` / `imgur.js` — third-party integrations (upload tokens; legacy Imgur reads for old contest data).
- `logger.js` — Winston logger factory (`createLogger(label, opts)`), level from `LOG_LEVEL` env var.
- The database schema is snapshotted in `server/db/schema.sql` (see Database schema above). There's no migrations folder.

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
