const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

if (process.env.OTEL_DIAGNOSTICS_DEBUG === 'true') {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
}

const otlpBase = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://collector:4318';
const traceExporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || `${otlpBase}/v1/traces`
});

const resource = new Resource({
  [SemanticResourceAttributes.SERVICE_NAME]: process.env.SERVICE_NAME || 'demo-app',
  [SemanticResourceAttributes.SERVICE_VERSION]: process.env.SERVICE_VERSION || '1.0.0',
  [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.DEPLOYMENT_ENVIRONMENT || 'local'
});

const sdk = new NodeSDK({
  resource,
  traceExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': {
        ignoreIncomingPaths: ['/healthz', '/readyz', '/metrics']
      },
      '@opentelemetry/instrumentation-fs': { enabled: false }
    })
  ]
});

async function startTelemetry(logger) {
  await sdk.start();
  if (logger) {
    logger.info({ component: 'telemetry' }, 'OpenTelemetry SDK initialized');
  }
}

async function shutdownTelemetry(logger) {
  try {
    await sdk.shutdown();
    if (logger) {
      logger.info({ component: 'telemetry' }, 'OpenTelemetry SDK shut down');
    }
  } catch (error) {
    if (logger) {
      logger.error({ err: error, component: 'telemetry' }, 'Failed to shutdown OpenTelemetry SDK');
    }
  }
}

module.exports = { startTelemetry, shutdownTelemetry };
