const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const path = require('path');

const express = require('express');
const helmet = require('helmet');

const accessToken = require('./api/accessToken');
const contest = require('./api/contest');
const contests = require('./api/contests');
const hallOfFame = require('./api/hallOfFame');
const init = require('./api/init');
const revokeToken = require('./api/revokeToken');
const settings = require('./api/settings');
const submission = require('./api/submission');
const votes = require('./api/votes');
const { createLogger } = require('./logger');

const logger = createLogger('INDEX');

const { NODE_ENV, PORT: ENV_PORT } = process.env;

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
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: [...defaultDirectives['default-src'], '*.googleapis.com'],
        imgSrc: [...defaultDirectives['img-src'], '*.imgur.com'],
        scriptSrc: [...defaultDirectives['script-src'], '*.google.com', '*.gstatic.com'],
      },
    }),
  );

  // Priority serve any static files.
  app.use(express.static(path.resolve(__dirname, '../react-ui/build')));

  const router = express.Router();

  router.use(express.json());

  router.get('/accessToken/:code', accessToken.get);
  router.get('/contests', contests.get);
  router.get('/contests/:id', contest.get);
  router.get('/hallOfFame', hallOfFame.get);
  router.get('/init', init.get);
  router.get('/revokeToken/:refreshToken', revokeToken.get);
  router.route('/settings').all(settings.all).get(settings.get).put(settings.put);
  router.route('/submission').get(submission.get).post(submission.post);
  router.route('/votes').all(votes.all).put(votes.put).delete(votes.delete);

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
