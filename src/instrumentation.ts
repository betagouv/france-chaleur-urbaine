import * as Sentry from '@sentry/nextjs';
import { isDefined } from '@/utils/core';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');

    if (!isDefined(process.env.DISABLE_TILES_CACHE)) {
      const { populateTilesCache } = await import('./modules/tiles/server/service');
      // Construit les tuiles des demandes en mémoire
      populateTilesCache();
    }
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
