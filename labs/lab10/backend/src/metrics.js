const client = require('prom-client');

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const labelNames = ['method', 'route', 'status_code'];

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP request duration in milliseconds',
  labelNames,
  buckets: [20, 50, 100, 200, 400, 800, 1200, 2000, 5000]
});

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests handled',
  labelNames
});

const httpErrorTotal = new client.Counter({
  name: 'http_requests_error_total',
  help: 'HTTP requests that returned 5xx',
  labelNames
});

const inflightRequests = new client.Gauge({
  name: 'http_inflight_requests',
  help: 'Currently processed HTTP requests'
});

const checkoutLatency = new client.Histogram({
  name: 'checkout_duration_ms',
  help: 'Synthetic business latency to show RED -> trace drill down',
  labelNames: ['flow']
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(httpErrorTotal);
register.registerMetric(inflightRequests);
register.registerMetric(checkoutLatency);

function metricsMiddleware(req, res, next) {
  const start = process.hrtime.bigint();
  inflightRequests.inc();

  res.on('finish', () => {
    inflightRequests.dec();
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    const route = req.route?.path || req.originalUrl.split('?')[0] || 'unmatched';
    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode)
    };
    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, durationMs);
    if (res.statusCode >= 500) {
      httpErrorTotal.inc(labels);
    }
  });

  res.on('close', () => {
    if (!res.writableEnded) {
      inflightRequests.dec();
    }
  });

  next();
}

async function metricsHandler(_req, res) {
  res.setHeader('Content-Type', register.contentType);
  res.end(await register.metrics());
}

function observeCheckout(flow, durationMs) {
  checkoutLatency.observe({ flow }, durationMs);
}

module.exports = {
  metricsMiddleware,
  metricsHandler,
  observeCheckout
};
