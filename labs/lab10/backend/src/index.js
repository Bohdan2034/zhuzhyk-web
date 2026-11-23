const http = require('http');
const app = require('./app');
const logger = require('./logger');
const { startTelemetry, shutdownTelemetry } = require('./telemetry');

const PORT = Number(process.env.PORT || 3000);
let server;

async function start() {
  await startTelemetry(logger);
  server = http.createServer(app);
  server.listen(PORT, () => {
    logger.info({ port: PORT }, 'http server listening');
  });
}

async function stop(signal) {
  logger.warn({ signal }, 'received signal, shutting down');
  await shutdownTelemetry(logger);
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  process.exit(0);
}

process.on('SIGTERM', () => stop('SIGTERM'));
process.on('SIGINT', () => stop('SIGINT'));

start().catch((error) => {
  logger.error({ err: error }, 'failed to start server');
  process.exit(1);
});
