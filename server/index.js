/* eslint-disable no-console */
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const path = require('path');

const express = require('express');
const helmet = require('helmet');
const shuffle = require('lodash/shuffle');

const db = require('./db');
const imgur = require('./imgur');
const memcache = require('./memcache');
const reddit = require('./reddit');

const isDev = process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 5000;

// Multi-process to utilize all CPU cores.
if (!isDev && cluster.isMaster) {
  console.error(`Node cluster master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i += 1) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.error(
      `Node cluster worker ${worker.process.pid} exited: code ${code}, signal ${signal}`,
    );
  });
} else {
  const app = express();

  const defaultDirectives = helmet.contentSecurityPolicy.getDefaultDirectives();
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          ...defaultDirectives,
          'img-src': [...defaultDirectives['img-src'], '*.imgur.com'],
        },
      },
    }),
  );

  // Priority serve any static files.
  app.use(express.static(path.resolve(__dirname, '../react-ui/build')));

  const router = express.Router();

  router.use(express.json());

  router.route('/contests').get(async (req, res) => {
    try {
      const result = await db.select('SELECT * FROM contests ORDER BY date DESC');
      res.send(
        result.rows.map((row) => ({
          ...row,
          date: row.date.toJSON().substr(0, 10),
        })),
      );
    } catch (err) {
      console.error(err.toString());
      res.status(500).send();
    }
  });

  router.route('/contests/:id').get(async ({ params: { id } }, res) => {
    try {
      const response = await memcache.get(
        `contest.${id}`,
        async () => {
          const contestResult = await db.select('SELECT name FROM contests WHERE id = $1', [id]);
          if (!contestResult.rowCount) {
            res.status(404).send();
            return null;
          }

          const contest = await reddit.getContest(id);
          const imageData = db.select('SELECT * FROM entries WHERE contest_id = $1', [id]);
          if (!imageData.rowCount) {
            contest.entries = await imgur.getImagesData(contest.entries);
          }

          return {
            name: contestResult.rows[0].name,
            ...contest,
          };
        },
        3600,
      );

      if (response.isContestMode) {
        response.entries = shuffle(response.entries);
      }
      res.send(response);
    } catch (err) {
      console.error(err.toString());
      res.status(500).send();
    }
  });

  app.use('/api', router);

  // All remaining requests return the React app, so it can handle routing.
  app.get('*', (request, response) => {
    response.sendFile(path.resolve(__dirname, '../react-ui/build', 'index.html'));
  });

  app.listen(PORT, () => {
    console.error(
      `Node ${isDev ? 'dev server' : `cluster worker ${process.pid}`}: listening on port ${PORT}`,
    );
  });
}
