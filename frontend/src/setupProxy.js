const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:12000',
      changeOrigin: true,
      // Don't rewrite the path - keep the /api prefix
    })
  );
};