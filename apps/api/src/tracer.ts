import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { DiagConsoleLogger, DiagLogLevel, diag } from '@opentelemetry/api';

// Only enable OTEL when a collector endpoint is explicitly configured.
// Without this guard the SDK will retry-spam "socket hang up" errors in local
// dev where the OTLP collector (port 4318) is not running.
const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT;
const otelEnabled = Boolean(otlpEndpoint);

if (otelEnabled && process.env.NODE_ENV !== 'production') {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);
}

const sdkConfig: ConstructorParameters<typeof NodeSDK>[0] = {
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'atlas-api',
    'deployment.environment': process.env.NODE_ENV || 'development',
  }),
  instrumentations: otelEnabled
    ? [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-fs': {
            enabled: false, // Often too noisy
          },
          '@opentelemetry/instrumentation-http': {
            ignoreIncomingRequestHook: (req: any) => {
              return (
                req.url === '/health' ||
                req.url === '/api/v1/metrics' ||
                req.url === '/metrics'
              );
            },
          },
        }),
      ]
    : [],
};

if (otelEnabled) {
  sdkConfig.traceExporter = new OTLPTraceExporter({ url: otlpEndpoint });
}

export const otelSDK = new NodeSDK(sdkConfig);

// Graceful shutdown
process.on('SIGTERM', () => {
  otelSDK
    .shutdown()
    .then(() => console.log('SDK terminated'))
    .catch((error) => console.log('Error terminating SDK', error))
    .finally(() => process.exit(0));
});

