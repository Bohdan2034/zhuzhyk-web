const { trace, SpanStatusCode } = require('@opentelemetry/api');
const { observeCheckout } = require('./metrics');
const logger = require('./logger');

const tracer = trace.getTracer('demo-workload');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const randomBetween = (min, max) => Math.random() * (max - min) + min;

async function simulateDbQuery({ shard, min = 40, max = 120, failRate = 0.02 }) {
  return tracer.startActiveSpan('db.query orders', async (span) => {
    span.setAttributes({
      'db.system': 'postgresql',
      'db.operation': 'SELECT',
      'db.namespace': 'orders-db',
      'db.shard.id': shard,
      'db.statement': 'SELECT * FROM orders WHERE user_id = $1'
    });

    const latency = randomBetween(min, max);
    await sleep(latency);

    if (Math.random() < failRate) {
      const error = new Error('orders-db timeout');
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.end();
      throw error;
    }

    span.setAttribute('db.response.time_ms', Number(latency.toFixed(2)));
    span.end();
    return latency;
  });
}

async function simulatePaymentCall({ min = 30, max = 150, failRate = 0.01 }) {
  return tracer.startActiveSpan('http.call payment-gateway', async (span) => {
    span.setAttributes({
      'http.method': 'POST',
      'http.route': '/payments/v1/charge',
      'http.url': 'https://payments.example/api',
      'net.peer.name': 'payments-gw'
    });

    const latency = randomBetween(min, max);
    await sleep(latency);

    if (Math.random() < failRate) {
      const error = new Error('payment provider 502');
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.end();
      throw error;
    }

    span.setAttribute('http.response_content_length', 512);
    span.end();
    return latency;
  });
}

async function processCheckout(flow = 'happy') {
  const start = Date.now();
  return tracer.startActiveSpan('checkout.flow', async (span) => {
    span.setAttributes({ 'app.checkout.flow': flow });

    try {
      const shard = flow === 'slow-db' ? 'shard-2' : 'shard-1';
      await simulateDbQuery({
        shard,
        min: flow === 'slow-db' ? 120 : 40,
        max: flow === 'slow-db' ? 450 : 150,
        failRate: flow === 'slow-db' ? 0.08 : 0.01
      });

      if (flow === 'payment-error') {
        await simulatePaymentCall({ failRate: 0.3, min: 40, max: 90 });
      } else {
        await simulatePaymentCall({});
      }

      const durationMs = Date.now() - start;
      span.setAttribute('checkout.duration_ms', durationMs);
      observeCheckout(flow, durationMs);
      span.end();
      return { ok: true, durationMs };
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.end();
      logger.error({ err: error, flow }, 'checkout failed');
      throw error;
    }
  });
}

module.exports = { processCheckout };
