/* eslint-disable func-names */
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  const proxyHandler = createProxyMiddleware({
    target: 'http://localhost:5000',
    changeOrigin: true,
    onError: (err, req, res) => {
      if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
        if (!res.headersSent) {
          res.writeHead(503, {
            'Content-Type': 'application/json',
          });
          res.end(JSON.stringify({ error: 'Backend server is restarting' }));
        }
        return;
      }
      if (!res.headersSent) {
        res.writeHead(500, {
          'Content-Type': 'application/json',
        });
        res.end(JSON.stringify({ error: 'Proxy error' }));
      }
    },
  });

  app.use('/api', proxyHandler);
  app.use('/i', proxyHandler);
};
