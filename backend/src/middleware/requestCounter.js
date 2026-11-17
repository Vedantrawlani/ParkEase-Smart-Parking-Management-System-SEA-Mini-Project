const stats = {
  totalRequests: 0,
  activeRequests: 0,
  statusCodeCounts: {},
  endpointHits: {},
  recentErrors: [],
  startTime: Date.now()
};

function requestCounter(req, res, next) {
  stats.totalRequests++;
  stats.activeRequests++;

  const endpoint = `${req.method} ${req.baseUrl || req.path}`;
  stats.endpointHits[endpoint] = (stats.endpointHits[endpoint] || 0) + 1;

  const start = Date.now();

  res.on('finish', () => {
    stats.activeRequests = Math.max(0, stats.activeRequests - 1);
    const code = res.statusCode;
    stats.statusCodeCounts[code] = (stats.statusCodeCounts[code] || 0) + 1;

    // Track 4xx and 5xx errors for system monitoring
    if (code >= 400) {
      stats.recentErrors.unshift({
        status: code,
        method: req.method,
        url: req.originalUrl,
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - start
      });
      // Keep last 15 errors
      if (stats.recentErrors.length > 15) {
        stats.recentErrors.pop();
      }
    }
  });

  next();
}

function getStats() {
  return {
    ...stats,
    uptimeSeconds: Math.floor((Date.now() - stats.startTime) / 1000)
  };
}

module.exports = {
  requestCounter,
  getStats
};

