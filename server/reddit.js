const Snoowrap = require('snoowrap');

const { createLogger } = require('./logger');

const logger = createLogger('REDDIT');

const { REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_PASSWORD } = process.env;

const r = new Snoowrap({
  userAgent: 'node:com.herokuapp.vexillology-contests:v0.1.0',
  clientId: REDDIT_CLIENT_ID,
  clientSecret: REDDIT_CLIENT_SECRET,
  username: 'heshammourad',
  password: REDDIT_PASSWORD,
});

const getContest = async (submissionId) => {
  logger.debug(`Getting contest submission: '${submissionId}`);
  const submission = await r.getSubmission(submissionId);
  const isContestMode = await submission.contest_mode;
  const entries = await submission.comments.reduce(
    (acc, {
      author, body, body_html: bodyHtml, id, permalink,
    }) => {
      if (author.name !== 'Vexy') {
        return acc;
      }

      const description = `<p>${bodyHtml.match(/<\/p>.*?<p>(.*)<\/p>/s)[1]}</p>`;
      const imgurId = body.match(/imgur\.com\/(\w*)(\.|\))/)[1];
      const name = body.match(/\*\*(.*?)\*\*/)[1];

      return [
        ...acc,
        {
          description,
          id,
          imgurId,
          name,
          permalink,
        },
      ];
    },
    [],
  );
  const contest = { entries, isContestMode };
  logger.debug(`Got contest: '${JSON.stringify(contest)}'`);
  return contest;
};

const getWinners = async (winnersThreadId) => {
  logger.debug(`Getting winners submission: '${winnersThreadId}'`);
  const submission = await r.getSubmission(winnersThreadId);
  const selftext = await submission.selftext;
  const winners = Array.from(selftext.matchAll(/(\d*)\|(.*)\|.*imgur\.com\/(\w*)(\.|\))/g), (match) => ({
    imgurId: match[3],
    rank: parseInt(match[1], 10),
    user: match[2],
  }));
  logger.debug(`Got winners: '${JSON.stringify(winners)}'`);
  return winners;
};

module.exports = { getContest, getWinners };
