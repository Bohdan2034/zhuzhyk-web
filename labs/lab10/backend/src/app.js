const express = require('express');
const { nanoid } = require('nanoid');
const logger = require('./logger');
const { metricsMiddleware, metricsHandler } = require('./metrics');
const { processCheckout } = require('./workload');

const app = express();
app.use(express.json());

let ready = false;
setTimeout(() => {
  ready = true;
}, Number(process.env.READY_DELAY_MS || 4000));

app.use((req, res, next) => {
  req.requestId = req.header('x-request-id') || nanoid(6);
  res.setHeader('x-request-id', req.requestId);
  next();
});

app.use(metricsMiddleware);

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      msg: 'http request complete',
      method: req.method,
      route: req.route?.path || req.originalUrl,
      status: res.statusCode,
      duration_ms: duration,
      request_id: req.requestId
    });
  });
  next();
});

app.get('/healthz', (_req, res) => res.status(200).json({ ok: true }));
app.get('/readyz', (_req, res) => (ready
  ? res.status(200).json({ ok: true })
  : res.status(503).json({ ok: false, error: 'booting dependencies' })));

app.get('/', (_req, res) => {
  res.json({
    ok: true,
    message: 'Observability demo backend',
    tips: ['call /api/orders', '/api/checkout', '/metrics'],
    time: new Date().toISOString()
  });
});

const orders = ['coffee', 'tea', 'muffin', 'latte', 'cappuccino'];

app.get('/api/orders', (_req, res) => {
  const items = Array.from({ length: 3 }, () => orders[Math.floor(Math.random() * orders.length)]);
  res.json({ ok: true, count: items.length, items });
});

app.get('/api/checkout', async (req, res) => {
  const flow = req.query.flow || 'happy';
  try {
    const { durationMs } = await processCheckout(flow);
    res.json({ ok: true, flow, duration_ms: durationMs });
  } catch (error) {
    logger.warn({ err: error, flow }, 'checkout degraded');
    res.status(502).json({ ok: false, flow, error: error.message });
  }
});

app.get('/api/slow', async (_req, res) => {
  try {
    const { durationMs } = await processCheckout('slow-db');
    res.json({ ok: true, flow: 'slow-db', duration_ms: durationMs });
  } catch (error) {
    res.status(504).json({ ok: false, error: error.message });
  }
});

app.get('/metrics', metricsHandler);

module.exports = app;
