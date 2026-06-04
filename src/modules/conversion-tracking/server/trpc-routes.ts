import { isIP } from 'node:net';

import { isbot } from 'isbot';

import { createUserEvent } from '@/modules/events/server/service';
import { adminRoute, route, router } from '@/modules/trpc/server';
import { getClientIp } from '@/server/helpers/request-ip';

import {
  zArchiveConversionSourceInput,
  zCreateConversionSourceInput,
  zGetConversionStatsInput,
  zListConversionSourcesInput,
  zRecordConversionEventInput,
  zUpdateConversionSourceInput,
} from '../constants';
import {
  archiveConversionSource,
  createConversionSource,
  getConversionStats,
  listConversionSources,
  recordConversionEvent,
  updateConversionSource,
} from './service';

export const conversionTrackingRouter = router({
  /** Funnel de conversion par source × période (admin). */
  getStats: adminRoute.input(zGetConversionStatsInput).query(({ input }) => getConversionStats(input)),
  /** Enregistre un événement de conversion. Public (appelé depuis les iframes / pages) + rate-limité. */
  recordEvent: route
    .meta({ rateLimit: { limit: 60, windowMs: 60 * 1000 } })
    .input(zRecordConversionEventInput)
    .mutation(async ({ input, ctx }) => {
      const userAgent = ctx.headers['user-agent'];
      // Crawlers (Googlebot…) : ils exécutent le JS des pages internes et gonfleraient les affichages.
      if (typeof userAgent === 'string' && isbot(userAgent)) {
        return;
      }
      const ip = getClientIp(ctx.req);
      await recordConversionEvent({
        ...input,
        ip: ip && isIP(ip) ? ip : null,
        source: input.source ?? null,
        user_agent: typeof userAgent === 'string' ? userAgent : null,
      });
    }),

  /** CRUD du registre des sources (admin). Chaque mutation émet un event d'audit `conversion_source_*`. */
  sources: {
    archive: adminRoute.input(zArchiveConversionSourceInput).mutation(async ({ input, ctx }) => {
      const archived = await archiveConversionSource(input.id);
      await createUserEvent({
        author_id: ctx.user.id,
        context_id: archived.id,
        context_type: 'conversion_source',
        data: { label: archived.label },
        type: 'conversion_source_archived',
      });
    }),
    create: adminRoute.input(zCreateConversionSourceInput).mutation(async ({ input, ctx }) => {
      // L'id (uuid) sert de source `?source=` : généré en base, jamais saisi → aucune collision possible.
      const created = await createConversionSource(input);
      await createUserEvent({
        author_id: ctx.user.id,
        context_id: created.id,
        context_type: 'conversion_source',
        data: { label: created.label },
        type: 'conversion_source_created',
      });
      return created;
    }),
    list: adminRoute.input(zListConversionSourcesInput).query(({ input }) => listConversionSources(input)),
    update: adminRoute.input(zUpdateConversionSourceInput).mutation(async ({ input, ctx }) => {
      const updated = await updateConversionSource(input);
      await createUserEvent({
        author_id: ctx.user.id,
        context_id: updated.id,
        context_type: 'conversion_source',
        data: { label: updated.label },
        type: 'conversion_source_updated',
      });
      return updated;
    }),
  },
});
