const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const path = require('path');

const express = require('express');
const helmet = require('helmet');
const { keyBy } = require('lodash');
const partition = require('lodash/partition');
const shuffle = require('lodash/shuffle');
const { v4: uuidv4 } = require('uuid');

const db = require('./db');
const imgur = require('./imgur');
const { createLogger } = require('./logger');
const memcache = require('./memcache');
const reddit = require('./reddit');
const { camelizeObjectKeys } = require('./util');

const logger = createLogger('INDEX');

const {
  CONTESTS_CACHE_TIMEOUT = 3600,
  ENV_LEVEL,
  NODE_ENV,
  PORT: ENV_PORT,
  TITLE = 'Vexillology Contests',
  WEB_APP_CLIENT_ID,
} = process.env;

const isDev = NODE_ENV !== 'production';
const PORT = ENV_PORT || 5000;

const LAST_WINNER_RANK = 20;

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
    helmet.contentSecurityPolicy({
      directives: { imgSrc: [...defaultDirectives['img-src'], '*.imgur.com'] },
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
    const { filteredData, repeatedIds } = await filterRepeatedIds(entries, 'id');
    if (repeatedIds.length) {
      logger.warn(`Error adding entries. Repeated ids: ${repeatedIds.join(', ')}`);
    }
    await db.insert('entries', filteredData);
  };

  const addContestEntries = async (contestId, entries) => {
    const { filteredData, repeatedIds } = await filterRepeatedIds(entries, 'id');
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

  router.get('/init', async (req, res) => {
    try {
      res.send({
        title: TITLE,
        webAppClientId: WEB_APP_CLIENT_ID,
      });
    } catch (err) {
      logger.error(`Error getting /init: ${err}`);
      res.status(500).send();
    }
  });

  router.get('/accessToken/:code', async ({ params: { code } }, res) => {
    try {
      const result = await reddit.retrieveAccessToken(code);
      if (!result) {
        throw new Error('Unable to retrieve access token');
      }

      const username = await reddit.getUser(result);

      camelizeObjectKeys([result]);
      const { accessToken, refreshToken } = result;
      if (!accessToken || !refreshToken) {
        throw new Error('Missing auth tokens');
      }

      const response = { accessToken, refreshToken, username };
      res.send(response);
    } catch (err) {
      logger.error(`Error retrieving access token: ${err}`);
      res.status(500).send();
    }
  });

  router.get('/revokeToken/:refreshToken', async ({ params: { refreshToken } }, res) => {
    try {
      if (!refreshToken) {
        logger.warn('Missing refresh token');
        res.status(400).send();
      }
      await reddit.revokeRefreshToken(refreshToken);
      res.status(204).send();
    } catch (e) {
      logger.error(`Error revoking token: ${e}`);
      res.status(500).send();
    }
  });

  router.get('/contests', async (req, res) => {
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

  router.get(
    '/contests/:id',
    async ({ headers: { accesstoken, refreshtoken }, params: { id } }, res) => {
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
              const contestWinners = imagesData.filter(
                (image) => image.rank && image.rank <= LAST_WINNER_RANK,
              );
              const winner = contestWinners.find(({ rank }) => rank === 1);
              if (contestWinners.length < LAST_WINNER_RANK || !winner.description) {
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
                  await db.update('contest_entries', contestEntriesData, [
                    '?contest_id',
                    '?entry_id',
                    'rank',
                  ]);
                  await db.update('entries', entriesData, ['?id', 'description', 'name', 'user']);
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

        if (accesstoken && refreshtoken) {
          const username = await reddit.getUser({ accesstoken, refreshtoken });
          logger.debug(`Auth tokens present, retrieving votes of ${username} on ${id}`);
          const votes = await db.select(
            'SELECT entry_id, rating FROM votes WHERE contest_id = $1 AND username = $2',
            [id, username],
          );
          logger.debug(`${username} votes on ${id}: '${JSON.stringify(votes)}'`);

          const entriesObj = keyBy(response.entries, 'imgurId');
          votes.forEach(({ entryId, rating }) => {
            entriesObj[entryId].rating = rating;
          });
          response.entries = Object.values(entriesObj);
          logger.debug(`Merged data: '${JSON.stringify(response.entries)}'`);
        }

        response.requestId = uuidv4();

        if (response.isContestMode && !winnersThreadId) {
          response.entries = shuffle(response.entries);
        } else {
          const [winners, entries] = partition(
            response.entries,
            ({ rank }) => rank && rank <= LAST_WINNER_RANK,
          );
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
    },
  );

  router
    .route('/votes')
    .all(
      (
        { body: { contestId, entryId, rating }, headers: { accesstoken, refreshtoken } },
        res,
        next,
      ) => {
        if (!accesstoken || !refreshtoken) {
          res.status(401).send('Missing authentication headers.');
          return;
        }

        if (!contestId || !entryId || !rating) {
          const missingFields = [];
          if (!contestId) {
            missingFields.push('contestId');
          }
          if (!entryId) {
            missingFields.push('entryId');
          }
          if (!rating && rating !== 0) {
            missingFields.push('rating');
          }
          res.status(400).send(`Missing required fields: ${missingFields.join(', ')}`);
          return;
        }

        if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
          res
            .status(400)
            .send(
              `Expected rating to be an integer between 0 and 5 inclusive. Received: ${rating}`,
            );
          return;
        }

        next();
      },
    )
    .put(async ({ body: { contestId, entryId, rating }, headers }, res) => {
      try {
        const username = await reddit.getUser(headers);
        const voteData = {
          contest_id: contestId,
          entry_id: entryId,
          username,
          rating,
        };

        const currentValue = await db.select(
          'SELECT * FROM votes WHERE contest_id = $1 AND entry_id = $2 AND username = $3',
          [contestId, entryId, username],
        );
        let status;
        if (!currentValue.length) {
          await db.insert('votes', [voteData]);
          status = 201;
        } else {
          await db.update('votes', [voteData], ['?contest_id', '?entry_id', '?username', 'rating']);
          status = 200;
        }
        camelizeObjectKeys([voteData]);
        res.status(status).send(voteData);
      } catch (err) {
        logger.error(`Error putting /vote: ${err}`);
        res.status(500).send();
      }
    });

  router.get('/hallOfFame', async (req, res) => {
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
