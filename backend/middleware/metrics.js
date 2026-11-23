
const client = require('prom-client');

const register = new client.Registry();

client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register]
});

const httpRequestsErrorTotal = new client.Counter({
    name: 'http_requests_error_total',
    help: 'Total number of HTTP 5xx errors',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register]
});

const httpInflightRequests = new client.Gauge({
    name: 'http_inflight_requests',
    help: 'Number of HTTP requests currently being processed',
    registers: [register]
});

const httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [register]
});

function metricsMiddleware(req, res, next) {
    if (req.path === '/metrics') {
        return next();
    }

    const start = process.hrtime.bigint();
    httpInflightRequests.inc();

    res.once('finish', () => {
        const duration = Number(process.hrtime.bigint() - start) / 1e9;

       const routePath = req.route?.path;

let route = 'unmatched';

if (routePath) {
    route = `${req.baseUrl}${routePath}`;

    if (route.length > 1 && route.endsWith('/')) {
        route = route.slice(0, -1);
    }
}

const labels = {
    method: req.method,
    route,
    status_code: String(res.statusCode)
};

        httpRequestsTotal.inc(labels);

        if (res.statusCode >= 500) {
            httpRequestsErrorTotal.inc(labels);
        }

        httpRequestDuration.observe(labels, duration);
        httpInflightRequests.dec();
    });

    next();
}

async function metricsHandler(req, res) {
    try {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
    } catch (error) {
        res.status(500).end('Failed to collect metrics');
    }
}

module.exports = {
    metricsMiddleware,
    metricsHandler
};
