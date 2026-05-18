import os from 'node:os';

import client from 'prom-client';

import { serverConfig } from '@/server/config';
import { logger } from '@/server/helpers/logger';

const PROBE_METRIC = 'process_cpu_user_seconds_total';
const GLOBAL_KEY = '__fcuPromRegister__';

// In Next.js, instrumentation.ts and pages/api are separate bundles that may
// each capture their own `client.register` reference. We deduplicate via
// globalThis so the same Registry instance is shared everywhere.
const globalScope = globalThis as typeof globalThis & {
  [GLOBAL_KEY]?: typeof client.register;
};

export const metricsRegister: typeof client.register = (globalScope[GLOBAL_KEY] ??= client.register);

export function initMetrics(): void {
  if (metricsRegister.getSingleMetric(PROBE_METRIC)) {
    return;
  }

  metricsRegister.setDefaultLabels({
    app: serverConfig.APP ?? 'local',
    instance: serverConfig.CONTAINER ?? os.hostname(),
  });

  client.collectDefaultMetrics({ register: metricsRegister });
  logger.info('Metrics initialized');
}
