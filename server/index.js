const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const path = require('path');

const cors = require('cors');
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const accessToken = require('./api/accessToken');
const analyzeVotes = require('./api/analyzeVotes');
const {
  processUser,
  requireAuthentication,
  requireModerator,
  requireRole,
} = require('./api/authentication');
const contest = require('./api/contest');
const contests = require('./api/contests');
const dev = require('./api/dev');
const hallOfFame = require('./api/hallOfFame');
const images = require('./api/images');
const init = require('./api/init');
const reviewSubmissions = require('./api/reviewSubmissions');
const revokeToken = require('./api/revokeToken');
const settings = require('./api/settings');
const staticContent = require('./api/staticContent');
const submission = require('./api/submission');
const { checkRequiredFields } = require('./api/validation');
const votes = require('./api/votes');
const UserPermissions = require('./db/userPermissions');
const { IS_DEV, BACKEND_PORT } = require('./env');
const { createLogger } = require('./logger');

const logger = createLogger('INDEX', {
  handleExceptions: true,
  handleRejections: true,
});

// Multi-process to utilize all CPU cores.
if (!IS_DEV && cluster.isMaster) {
  logger.info(`Node cluster master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i += 1) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    logger.info(
      `Node cluster worker ${worker.process.pid} exited: code ${code}, signal ${signal}`,
    );
  });
} else {
  const app = express();

  app.enable('trust proxy');
  app.use(({
    hostname, protocol, secure, url,
  }, res, next) => {
    const isOldDomain = hostname === 'vexillology-contests.herokuapp.com';
    if (!IS_DEV && (!secure || isOldDomain)) {
      const newDomain = isOldDomain ? 'www.vexillologycontests.com' : hostname;
      const redirectUrl = `https://${newDomain}${url}`;
      res.redirect(301, redirectUrl);
      logger.info(
        `Request: ${protocol}://${hostname}${url}, redirecting to ${redirectUrl}`,
      );
      return;
    }

    next();
  });

  const defaultDirectives = helmet.contentSecurityPolicy.getDefaultDirectives();
  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: [
          ...defaultDirectives['default-src'],
          '*.google.com',
          '*.googleapis.com',
          'streamable.com',
          '*.streamable.com',
        ],
        imgSrc: [
          ...defaultDirectives['img-src'],
          '*.amazonaws.com',
          '*.crwflags.com',
          '*.fotw.info',
          '*.googleapis.com',
          '*.imgur.com',
          '*.nocookie.net',
          '*.wikimedia.org',
        ],
        scriptSrc: [
          ...defaultDirectives['script-src'],
          '*.google.com',
          '*.gstatic.com',
        ],
      },
    }),
  );

  // Priority serve any static files.
  app.use(express.static(path.resolve(__dirname, '../react-ui/build')));

  const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100,
  });
  app.use('/api', limiter);

  const modRouter = express.Router();
  modRouter.use(express.json());

  modRouter.all('*', requireModerator);
  modRouter
    .route('/reviewSubmissions')
    .get(reviewSubmissions.get)
    .put(checkRequiredFields('id', 'status'), reviewSubmissions.put);
  modRouter.route('/analyzeVotes/:id').get(analyzeVotes.get);

  const apiRouter = express.Router();
  apiRouter.use(express.json());

  apiRouter.get('/accessToken/:code', accessToken.get);
  apiRouter.get('/contests', contests.get);
  apiRouter.get('/contests/:contestId', processUser(false), contest.get);
  apiRouter.get('/hallOfFame', hallOfFame.get);
  apiRouter.get('/init', processUser(true), init.get);
  apiRouter.get('/revokeToken/:refreshToken', revokeToken.get);
  apiRouter
    .route('/settings')
    .all(requireAuthentication)
    .get(settings.get)
    .put(settings.put);
  apiRouter.get('/staticContent/:id', staticContent.get);
  apiRouter
    .route('/submission')
    .get(processUser(false), submission.get)
    .post(
      requireRole(UserPermissions.PARTICIPATE_IN_CONTEST),
      checkRequiredFields('description', 'height', 'name', 'url', 'width'),
      submission.post,
    )
    .put(
      requireAuthentication,
      checkRequiredFields('id', 'submissionStatus'),
      submission.put,
    );
  apiRouter
    .route('/votes')
    .all(requireAuthentication, votes.all)
    .put(checkRequiredFields('contestId', 'entryId', 'rating'), votes.put)
    .delete(checkRequiredFields('contestId', 'entryId'), votes.delete);
  apiRouter.use('/mod', modRouter);

  if (IS_DEV) {
    apiRouter.route('/dev/contest').put(requireAuthentication, dev.contest);
    apiRouter.route('/dev/mod').put(requireAuthentication, dev.mod);
  }

  app.use('/api', apiRouter);

  const imageRouter = express.Router();
  imageRouter.get('/:image', images.get);
  app.use('/i', cors(), imageRouter);

  // All remaining requests return the React app, so it can handle routing.
  app.get('*', (request, response) => {
    response.sendFile(
      path.resolve(__dirname, '../react-ui/build', 'index.html'),
    );
  });

  app.listen(BACKEND_PORT, () => {
    logger.info(
      `Node ${
        IS_DEV ? 'dev server' : `cluster worker ${process.pid}`
      }: listening on port ${BACKEND_PORT}`,
    );
  });
}
