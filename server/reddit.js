const Snoowrap = require('snoowrap');

const { REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_PASSWORD } = process.env;

const r = new Snoowrap({
  userAgent: 'node:com.herokuapp.vexillology-contests:v0.1.0',
  clientId: REDDIT_CLIENT_ID,
  clientSecret: REDDIT_CLIENT_SECRET,
  username: 'heshammourad',
  password: REDDIT_PASSWORD,
});

const getEntries = async (submissionId) => {
  const entries = await r.getSubmission(submissionId).comments.map(({
    body, body_html: bodyHtml, id, permalink,
  }) => {
    const name = body.match(/\*\*(.*?)\*\*/)[1];
    const imgurLink = body.match(/https:\/\/i\.imgur\.com\/.*\.png/)[0];
    const description = `<p>${bodyHtml.match(/<\/p>.*?<p>(.*)<\/p>/s)[1]}</p>`;

    return {
      description,
      id,
      imgurLink,
      name,
      permalink,
    };
  });
  return entries;
};

module.exports = { getEntries };
