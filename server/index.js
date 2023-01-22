const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const path = require('path');

const { isAfter, isBefore } = require('date-fns');
const express = require('express');
const helmet = require('helmet');
const keyBy = require('lodash/keyBy');
const partition = require('lodash/partition');
const shuffle = require('lodash/shuffle');
const numeral = require('numeral');
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

  const addEntries = async (entries) => {
    const { filteredData, repeatedIds } = await filterRepeatedIds(entries, 'id');
    if (repeatedIds.length) {
      logger.warn(`Error adding entries. Repeated ids: ${repeatedIds.join(', ')}`);
    }
    await db.insert('entries', filteredData);
  };

  const getVoteDates = async (contestId) => {
    const voteDates = await db.select(
      'SELECT vote_start, vote_end, now() FROM contests WHERE id = $1',
      [contestId],
    );
    return voteDates;
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
      camelizeObjectKeys([result]);
      const { accessToken, refreshToken } = result;
      if (!accessToken || !refreshToken) {
        throw new Error('Missing auth tokens');
      }

      const username = await reddit.getUser(result);
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
        const contestResults = await db.select(
          'SELECT name, date, local_voting, subtext, valid_reddit_id, winners_thread_id FROM contests WHERE id = $1 AND env_level >= $2',
          [id, ENV_LEVEL],
        );
        if (!contestResults.length) {
          logger.warn(`Contest id: ${id} not found in database.`);
          res.status(404).send();
          return;
        }

        const {
          date, name, localVoting, subtext, validRedditId, winnersThreadId,
        } = contestResults[0];
        if (!validRedditId) {
          logger.warn('Attempting to access contest with invalid reddit id');
          res.status(501).send();
          return;
        }

        const contest = await memcache.get(
          `reddit.${id}`,
          async () => {
            const contestData = await reddit.getContest(id);
            return contestData;
          },
          600,
        );

        const imagesData = await db.select(
          'SELECT * FROM entries e JOIN contest_entries ce ON e.id = ce.entry_id WHERE contest_id = $1',
          [id],
        );

        const contestEntriesData = [];
        if (winnersThreadId) {
          const contestWinners = imagesData.filter(
            (image) => image.rank && image.rank <= LAST_WINNER_RANK,
          );
          const winner = contestWinners.find(({ rank }) => rank === 1);
          if (contestWinners.length < LAST_WINNER_RANK || !winner.description) {
            const winners = await memcache.get(
              `reddit.${winnersThreadId}`,
              async () => {
                const winnerData = await reddit.getWinners(winnersThreadId);
                return winnerData;
              },
              CONTESTS_CACHE_TIMEOUT,
            );

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

                const { description, name: entryName } = contest.entries.find(
                  (entry) => entry.imgurId === imgurId,
                );
                entriesData.push({
                  description,
                  id: imgurId,
                  name: entryName,
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
          res.status(404).send();
          return;
        }

        const response = {
          date: date.toJSON().substr(0, 10),
          localVoting,
          name,
          requestId: uuidv4(),
          subtext,
          validRedditId,
          winnersThreadId,
          ...contest,
        };

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

        const [{ now, voteStart, voteEnd }] = await getVoteDates(id);
        if (voteStart && voteEnd) {
          if (isBefore(now, voteStart)) {
            logger.error('Requesting contest before voting window opened');
            res.status(404).send('Contest voting window is not open yet');
            return;
          }
          response.isContestMode = isBefore(now, voteEnd);
          response.voteEnd = voteEnd;
        }

        if (response.isContestMode && !winnersThreadId) {
          response.entries = shuffle(
            response.entries.map(({ rank, user, ...entry }) => entry),
          ).sort((a, b) => {
            if (a.rating > -1 && b.rating === undefined) {
              return 1;
            }
            if (b.rating > -1 && a.rating === undefined) {
              return -1;
            }
            if (a.rating === undefined && b.rating === undefined) {
              return 0;
            }
            return b.rating - a.rating;
          });
        } else if (localVoting) {
          const voteData = await db.select(
            'SELECT entry_id, rank, average FROM contests_summary WHERE contest_id = $1',
            [id],
          );
          const map = new Map();
          voteData.forEach(({ average, entryId, rank }) => {
            map.set(entryId, { average: numeral(average).format('0.00'), rank });
          });
          response.entries.forEach((entry) => {
            map.set(entry.imgurId, {
              ...entry,
              ...map.get(entry.imgurId),
            });
          });
          response.entries = Array.from(map.values()).sort((a, b) => a.rank - b.rank);
        } else {
          const [winners, entries] = partition(
            response.entries,
            ({ rank }) => rank && rank <= LAST_WINNER_RANK,
          );
          response.entries = entries.map(({ rank, user, ...entry }) => entry);
          if (winners.length) {
            response.winners = winners.sort((a, b) => a.rank - b.rank);
          }
        }

        res.send(response);

        try {
          const updateData = response.entries.map(({ description, imgurId, name: entryName }) => ({
            description,
            id: imgurId,
            name: entryName,
          }));
          await db.update('entries', updateData, ['?id', 'description', 'name']);
        } catch (err) {
          logger.error(`Unable to update db: ${err}`);
        }
      } catch (err) {
        logger.error(`Error getting /contest/${id}: ${err})}`);
        res.status(500).send();
      }
    },
  );

  router
    .route('/votes')
    .all(async ({ body: { contestId }, headers: { accesstoken, refreshtoken } }, res, next) => {
      try {
        if (!accesstoken || !refreshtoken) {
          res.status(401).send('Missing authentication headers.');
          return;
        }

        if (contestId) {
          logger.debug(`Vote change on ${contestId}`);
          const voteDates = await getVoteDates(contestId);

          if (!voteDates || !voteDates.length) {
            const message = 'contestId not found';
            logger.warn(message);
            res.status(400).send(message);
            return;
          }

          const [{ now, voteStart, voteEnd }] = voteDates;
          if (!voteStart || !voteEnd) {
            const message = 'Unable to find voting dates for contest';
            logger.error(`${message}: ${contestId}`);
            res.status(500).send(message);
            return;
          }

          if (isBefore(now, voteStart)) {
            logger.error('Vote submitted before voting window opened');
            res.status(403).send(`Voting window doesn't open until ${voteStart}`);
            return;
          }

          if (isAfter(now, voteEnd)) {
            logger.warn('Vote submitted after voting window closed');
            res.status(403).send(`Voting window closed at ${voteEnd}`);
            return;
          }
        }
        next();
      } catch (err) {
        logger.error(`Error validating /vote request: ${err}`);
        res.status(500).send();
      }
    })
    .put(async ({ body: { contestId, entryId, rating }, headers }, res) => {
      try {
        const missingRating = !rating && rating !== 0;
        if (!contestId || !entryId || missingRating) {
          const missingFields = [];
          if (!contestId) {
            missingFields.push('contestId');
          }
          if (!entryId) {
            missingFields.push('entryId');
          }
          if (missingRating) {
            missingFields.push('rating');
          }
          res.status(400).send(`Missing required fields: ${missingFields.join(', ')}`);
          return;
        }

        if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
          res.status(400).send('Expected rating to be an integer between 0 and 5 inclusive.');
          return;
        }

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
    })
    .delete(async ({ body: { contestId, entryId }, headers }, res) => {
      try {
        if (!contestId || !entryId) {
          const missingFields = [];
          if (!contestId) {
            missingFields.push('contestId');
          }
          if (!entryId) {
            missingFields.push('entryId');
          }
          res.status(400).send(`Missing required fields: ${missingFields.join(', ')}`);
          return;
        }

        const username = await reddit.getUser(headers);
        const voteData = { contest_id: contestId, entry_id: entryId, username };
        await db.del('votes', voteData);
        res.status(204).send();
      } catch (err) {
        logger.error(`Error deleting /vote: ${err}`);
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
