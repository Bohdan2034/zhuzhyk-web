const pino = require('pino');
const { context, trace } = require('@opentelemetry/api');

const base = {
  service: process.env.SERVICE_NAME || 'demo-app',
  env: process.env.DEPLOYMENT_ENVIRONMENT || 'local'
};

const logFilePath = process.env.LOG_FILE_PATH || '/var/log/demo/app.log';

const streams = [
  { stream: pino.destination(1) }
];

if (logFilePath) {
  streams.push({ stream: pino.destination({ dest: logFilePath, mkdir: true }) });
}

const logger = pino({
  base,
  level: process.env.LOG_LEVEL || 'info',
  timestamp: () => `,"ts":"${new Date().toISOString()}"`,
  formatters: {
    log(object) {
      const span = trace.getSpan(context.active());
      if (span) {
        const spanContext = span.spanContext();
        if (spanContext?.traceId && spanContext.traceId !== '0'.repeat(32)) {
          return {
            ...object,
            trace_id: spanContext.traceId,
            span_id: spanContext.spanId
          };
        }
      }
      return object;
    }
  }
}, pino.multistream(streams));

module.exports = logger;
