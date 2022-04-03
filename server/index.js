/* eslint-disable no-console */
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const path = require('path');

const express = require('express');
const helmet = require('helmet');
const partition = require('lodash/partition');
const shuffle = require('lodash/shuffle');

const db = require('./db');
const imgur = require('./imgur');
const memcache = require('./memcache');
const reddit = require('./reddit');

const { ENV_LEVEL, NODE_ENV, PORT: ENV_PORT } = process.env;

const isDev = NODE_ENV !== 'production';
const PORT = ENV_PORT || 5000;

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

  app.enable('trust proxy');
  app.use((req, res, next) => {
    const host = req.header('host');
    const isOldDomain = host.equals('vexillology-contests.herokuapp.com');
    if (!isDev && (!req.secure || isOldDomain)) {
      const newDomain = isOldDomain ? 'www.vexillologycontests.com' : req.headers.host;
      res.redirect(301, `https://${newDomain}${req.url}`);
      return;
    }

    next();
  });

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

  // eslint-disable-next-line max-len
  const findMissingEntries = (contest, imagesData) => contest.entries.filter((entry) => !imagesData.find((image) => image.id === entry.imgurId));

  const addContestEntries = async (contestId, entries) => {
    await db.insert(
      'contest_entries',
      entries.map((entry) => ({
        contest_id: contestId,
        entry_id: entry.id,
      })),
    );
  };

  // Priority serve any static files.
  app.use(express.static(path.resolve(__dirname, '../react-ui/build')));

  const router = express.Router();

  router.use(express.json());

  router.route('/contests').get(async (req, res) => {
    try {
      const result = await db.select(
        'SELECT id, name, date, year_end FROM contests WHERE env_level >= $1 ORDER BY date DESC',
        [ENV_LEVEL],
      );
      res.send(
        result.map(({
          date, id, name, year_end: yearEnd,
        }) => ({
          date: date.toJSON().substr(0, 10),
          id,
          name,
          yearEnd,
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
          const contestResult = await db.select(
            'SELECT name, winners_thread_id FROM contests WHERE id = $1 AND env_level >= $2',
            [id, ENV_LEVEL],
          );
          if (!contestResult.length) {
            return null;
          }

          const contest = await reddit.getContest(id);
          const imagesData = await db.select(
            'SELECT * FROM entries e JOIN contest_entries ce ON e.id = ce.entry_id WHERE contest_id = $1',
            [id],
          );

          const winnersThreadId = contestResult[0].winners_thread_id;
          if (winnersThreadId) {
            const contestTop20 = imagesData.filter((image) => image.rank && image.rank <= 20);
            if (contestTop20.length < 20) {
              const winners = await reddit.getWinners(winnersThreadId);

              const data = [];
              winners.forEach(({ imgurId, rank }) => {
                imagesData.find((image) => image.id === imgurId).rank = rank;
                data.push({
                  contest_id: id,
                  entry_id: imgurId,
                  rank,
                });
              });

              await db.update(data, ['?contest_id', '?entry_id', 'rank'], 'contest_entries');
            }
          }

          const allImagesData = [...imagesData];
          let missingEntries = findMissingEntries(contest, allImagesData);
          if (missingEntries.length) {
            const entriesData = await db.select('SELECT * FROM entries WHERE id = ANY ($1)', [
              missingEntries.map((entry) => entry.imgurId),
            ]);
            if (entriesData.length) {
              await addContestEntries(id, entriesData);
              allImagesData.push(...entriesData);
            }
          }

          missingEntries = findMissingEntries(contest, allImagesData);
          if (missingEntries.length) {
            const imgurData = (await imgur.getImagesData(missingEntries)).map(
              ({ imgurId, height, width }) => ({
                id: imgurId,
                height,
                width,
              }),
            );
            if (imgurData.length) {
              await db.insert('entries', imgurData);
              await addContestEntries(id, imgurData);
              allImagesData.push(...imgurData);
            }
          }

          contest.entries = contest.entries.reduce((acc, cur) => {
            const imageData = allImagesData.find((image) => cur.imgurId === image.id);
            if (imageData) {
              const {
                id: imgurId, height, rank, width,
              } = imageData;
              acc.push({
                ...cur,
                imgurId,
                imgurLink: `https://i.imgur.com/${imgurId}.png`,
                height,
                rank,
                width,
              });
            }
            return acc;
          }, []);
          if (!contest.entries.length) {
            return null;
          }

          return {
            name: contestResult[0].name,
            ...contest,
          };
        },
        3600,
      );

      if (!response) {
        res.status(404).send();
        return;
      }

      if (response.isContestMode) {
        response.entries = shuffle(response.entries);
      } else {
        const result = partition(response.entries, 'rank');
        response.entries = [...result[0].sort((a, b) => a.rank - b.rank), ...result[1]];
      }

      res.send(response);
    } catch (err) {
      console.error(err.toString());
      res.status(500).send();
    }
  });

  router.route('/hallOfFame').get(async (req, res) => {
    try {
      const result = await db.select('SELECT * FROM hall_of_fame');
      res.send(
        result.map(
          ({
            contest_id: contestId,
            contest_name: contestName,
            date,
            entry_id: entryId,
            entry_name: entryName,
            valid_reddit_id: validRedditId,
            winners_thread_id: winnersThreadId,
            ...rest
          }) => {
            let redditThreadId = winnersThreadId;
            if (!redditThreadId && validRedditId) {
              redditThreadId = contestId;
            }
            return {
              date: date.toJSON().substr(0, 7),
              contestName,
              entryId,
              entryName,
              redditThreadId,
              ...rest,
            };
          },
        ),
      );
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
