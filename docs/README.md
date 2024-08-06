## Environment variables

Environment variables are stored in a `.env` file in the root directory.

To create your own `.env` file: 1. Duplicate `.env.template` 2. Remove `.template` from the file name 3. Fill in `XXXXXX`

`env.js` files help process certain `.env` variables, largely by ensuring that `development` conditions are not accidentally pushed to production. However, every time a developer changes a variable locally and does not revert the change before a push, that variable is silently pulled by other developers and can impact their dev environment. We therefore use a similar convention as above with a `.gitignore` on these `env.js` files to make sure these variables default to production behavior on each commit.

To create your own `env.js` files: 1. Locate the two `env.template.js` files, one in `/react-ui/src` and the other in `/server` 2. Duplicate the `.template.js` files in their respective folders 3. Remove `.template` from the file names. 4. Modify your `env.js` files as you see fit. Ask a team member if you need pointers.

If your code requires all developers to change their `env.js` file (eg adding a variable), you must: 1. Add the variable to the corresponding `env.template.js` _as the production value_ 2. Reference the change to `/react-ui/src/env.js` or `/server/env.js` in the commit message 3. Notify the team (ideally through Discord) to copy the changes into their `env.js` file
