const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const path = require('path');

const express = require('express');
const helmet = require('helmet');
const partition = require('lodash/partition');
const shuffle = require('lodash/shuffle');
const { v4: uuidv4 } = require('uuid');

const db = require('./db');
const imgur = require('./imgur');
const { createLogger } = require('./logger');
const memcache = require('./memcache');
const reddit = require('./reddit');

const logger = createLogger('INDEX');

const {
  CONTESTS_CACHE_TIMEOUT = 3600,
  ENV_LEVEL,
  NODE_ENV,
  PORT: ENV_PORT,
  TITLE = 'Vexillology Contests',
} = process.env;

const isDev = NODE_ENV !== 'production';
const PORT = ENV_PORT || 5000;

// Multi-process to utilize all CPU cores.
if (!isDev && cluster.isMaster) {
  logger.info(`Node cluster master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i += 1) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    logger.info(`Node cluster worker ${worker.process.pid} exited: code ${code}, signal ${signal}`);
  });
} else {
  const app = express();

  app.enable('trust proxy');
  app.use(({
    hostname, protocol, secure, url,
  }, res, next) => {
    const isOldDomain = hostname === 'vexillology-contests.herokuapp.com';
    if (!isDev && (!secure || isOldDomain)) {
      const newDomain = isOldDomain ? 'www.vexillologycontests.com' : hostname;
      const redirectUrl = `https://${newDomain}${url}`;
      res.redirect(301, redirectUrl);
      logger.info(`Request: ${protocol}://${hostname}${url}, redirecting to ${redirectUrl}`);
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

  const filterRepeatedIds = async (data, idField) => {
    const ids = new Set();
    const filteredData = [];
    const repeatedIds = [];
    data.forEach((datum) => {
      const id = datum[idField];
      if (ids.has(id)) {
        repeatedIds.push(id);
      } else {
        filteredData.push(datum);
      }
      ids.add(id);
    });
    return { filteredData, repeatedIds };
  };

  const addEntries = async (entries) => {
    const { filteredData, repeatedIds } = filterRepeatedIds(entries, 'id');
    if (repeatedIds.length) {
      logger.warn(`Error adding entries. Repeated ids: ${repeatedIds.join(', ')}`);
    }
    await db.insert('entries', filteredData);
  };

  const addContestEntries = async (contestId, entries) => {
    const { filteredData, repeatedIds } = filterRepeatedIds(entries, 'id');
    if (repeatedIds.length) {
      logger.warn(`Error adding contest entries. Repeated ids: ${repeatedIds.join(', ')}`);
    }
    await db.insert(
      'contest_entries',
      filteredData.map((entry) => ({
        contest_id: contestId,
        entry_id: entry.id,
        rank: entry.rank,
      })),
    );
  };

  // Priority serve any static files.
  app.use(express.static(path.resolve(__dirname, '../react-ui/build')));

  const router = express.Router();

  router.use(express.json());

  router.route('/init').get(async (req, res) => {
    try {
      res.send({
        title: TITLE,
      });
    } catch (err) {
      logger.error(`Error getting /init: ${err}`);
      res.status(500).send();
    }
  });

  router.route('/contests').get(async (req, res) => {
    try {
      const result = await db.select(
        'SELECT id, name, date, year_end FROM contests WHERE env_level >= $1 ORDER BY date DESC',
        [ENV_LEVEL],
      );
      res.send(
        result.map(({ date, ...rest }) => ({
          ...rest,
          date: date.toJSON().substr(0, 10),
        })),
      );
    } catch (err) {
      logger.error(`Error getting /contests: ${err}`);
      res.status(500).send();
    }
  });

  router.route('/contests/:id').get(async ({ params: { id } }, res) => {
    try {
      let winnersThreadId;
      const response = await memcache.get(
        `contest.${id}`,
        async () => {
          const contestResults = await db.select(
            'SELECT name, date, valid_reddit_id, winners_thread_id FROM contests WHERE id = $1 AND env_level >= $2',
            [id, ENV_LEVEL],
          );
          if (!contestResults.length) {
            logger.warn(`Contest id: ${id} not found in database.`);
            return null;
          }
          const contestResult = contestResults[0];

          const contest = await reddit.getContest(id);
          const imagesData = await db.select(
            'SELECT * FROM entries e JOIN contest_entries ce ON e.id = ce.entry_id WHERE contest_id = $1',
            [id],
          );

          winnersThreadId = contestResult.winnersThreadId;
          const contestEntriesData = [];
          if (winnersThreadId) {
            const contestTop20 = imagesData.filter((image) => image.rank && image.rank <= 20);
            const winner = contestTop20.find(({ rank }) => rank === 1);
            if (contestTop20.length < 20 || !winner.description) {
              const winners = await reddit.getWinners(winnersThreadId);

              const entriesData = [];
              winners.forEach(({ imgurId, rank, user }) => {
                contestEntriesData.push({
                  contest_id: id,
                  entry_id: imgurId,
                  rank,
                });

                const imageData = imagesData.find((image) => image.id === imgurId);
                if (imageData) {
                  imageData.rank = rank;
                  imageData.user = user;

                  const { description, name } = contest.entries.find(
                    (entry) => entry.imgurId === imgurId,
                  );
                  entriesData.push({
                    description,
                    id: imgurId,
                    name,
                    user,
                  });
                }
              });

              if (entriesData.length) {
                await db.update(
                  contestEntriesData,
                  ['?contest_id', '?entry_id', 'rank'],
                  'contest_entries',
                );
                await db.update(entriesData, ['?id', 'description', 'name', 'user'], 'entries');
              }
            }
          }

          const getEntryRank = (entryId) => {
            const contestEntry = contestEntriesData.find((entry) => entry.entry_id === entryId);
            if (contestEntry) {
              return contestEntry.rank;
            }
            return null;
          };

          const allImagesData = [...imagesData];
          let missingEntries = findMissingEntries(contest, allImagesData);
          if (missingEntries.length) {
            const entriesData = await db.select('SELECT * FROM entries WHERE id = ANY ($1)', [
              missingEntries.map((entry) => entry.imgurId),
            ]);
            const contestEntries = entriesData.map((entry) => ({
              ...entry,
              rank: getEntryRank(entry.id),
            }));
            if (entriesData.length) {
              await addContestEntries(id, contestEntries);
              allImagesData.push(...contestEntries);
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
              await addEntries(imgurData);
              const contestEntries = imgurData.map((imageData) => ({
                ...imageData,
                rank: getEntryRank(imageData.id),
              }));
              await addContestEntries(id, contestEntries);
              allImagesData.push(...contestEntries);
            }
          }

          missingEntries = findMissingEntries(contest, allImagesData);
          if (missingEntries.length) {
            logger.warn(
              `Unable to retrieve image data for: [${missingEntries
                .map(({ imgurId }) => imgurId)
                .join(', ')}] in contest ${id}.`,
            );
          }

          contest.entries = contest.entries.reduce((acc, cur) => {
            const imageData = allImagesData.find((image) => cur.imgurId === image.id);
            if (imageData) {
              const {
                id: imgurId, height, rank, width, user,
              } = imageData;
              acc.push({
                ...cur,
                imgurId,
                imgurLink: `https://i.imgur.com/${imgurId}.png`,
                height,
                rank,
                width,
                user,
              });
            }
            return acc;
          }, []);
          if (!contest.entries.length) {
            logger.warn(`Unable to retrieve entries for contest: '${id}'`);
            return null;
          }

          return {
            date: contestResult.date.toJSON().substr(0, 10),
            name: contestResult.name,
            validRedditId: contestResult.validRedditId,
            winnersThreadId,
            ...contest,
          };
        },
        CONTESTS_CACHE_TIMEOUT,
      );

      if (!response) {
        logger.warn(`Unable to find contest: '${id}'`);
        res.status(404).send();
        return;
      }

      response.requestId = uuidv4();

      if (response.isContestMode && !winnersThreadId) {
        response.entries = shuffle(response.entries);
      } else {
        const [winners, entries] = partition(response.entries, ({ rank }) => rank && rank < 20);
        response.entries = entries;
        if (winners.length) {
          response.winners = winners.sort((a, b) => a.rank - b.rank);
        }
      }

      res.send(response);
    } catch (err) {
      logger.error(`Error getting /contest/${id}: ${err})}`);
      res.status(500).send();
    }
  });

  router.route('/hallOfFame').get(async (req, res) => {
    try {
      const result = await db.select('SELECT * FROM hall_of_fame');

      const removedYearEndWinners = [];
      const response = result.reduce(
        (acc, {
          contestId, date, entryId, validRedditId, winnersThreadId, yearEnd, ...rest
        }) => {
          if (yearEnd && result.filter((entry) => entry.entryId === entryId).length > 1) {
            removedYearEndWinners.push(entryId);
            return acc;
          }

          let redditThreadId = winnersThreadId;
          if (!redditThreadId && validRedditId) {
            redditThreadId = contestId;
          }

          return [
            ...acc,
            {
              date: date.toJSON().substr(0, 7),
              entryId,
              redditThreadId,
              yearEndContest: yearEnd,
              yearEndWinner: yearEnd || removedYearEndWinners.includes(entryId),
              ...rest,
            },
          ];
        },
        [],
      );
      logger.debug(`Got '${JSON.stringify(response)}' for /hallOfFame`);
      res.send(response);
    } catch (err) {
      logger.error(`Error getting /hallOfFame: ${err}`);
      res.status(500).send();
    }
  });

  app.use('/api', router);

  // All remaining requests return the React app, so it can handle routing.
  app.get('*', (request, response) => {
    response.sendFile(path.resolve(__dirname, '../react-ui/build', 'index.html'));
  });

  app.listen(PORT, () => {
    logger.info(
      `Node ${isDev ? 'dev server' : `cluster worker ${process.pid}`}: listening on port ${PORT}`,
    );
  });
}
