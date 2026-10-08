import { z } from 'zod';

import { adminRoute, route, router } from '@/modules/trpc/server';

import {
  networkChangeRequestGeometryRoles,
  zAcceptNetworkChangeRequestInput,
  zCreateNetworkChangeRequestInput,
  zLinkNetworkChangeRequestInput,
  zReplaceNetworkChangeRequestGeometryFileInput,
} from '../constants';
import {
  acceptNetworkChangeRequest,
  countPendingNetworkChangeRequests,
  createNetworkChangeRequest,
  getNetworkChangeRequestGeometry,
  getNetworkChangeRequestReviewContext,
  linkNetworkChangeRequest,
  listNetworkChangeRequests,
  renameNetworkChangeRequestFile,
  replaceNetworkChangeRequestGeometryFile,
  retryNetworkChangeRequestGeometryConversion,
} from './service';

export const networkChangeRequestsRouter = router({
  admin: {
    /** Applies the included changes (status `processed`) and emails the submitter when something was published. */
    accept: adminRoute
      .input(zAcceptNetworkChangeRequestInput)
      .mutation(({ input, ctx }) => acceptNetworkChangeRequest(input, { logger: ctx.logger, userId: ctx.user.id })),
    /** Number of requests waiting for a review (admin menu badge). */
    countPending: adminRoute.query(() => countPendingNetworkChangeRequests()),
    /** Converted geometry of the uploaded files, for the before / after map. */
    getRequestGeometry: adminRoute
      .input(z.object({ id: z.uuid(), role: z.enum(networkChangeRequestGeometryRoles) }))
      .query(({ input }) => getNetworkChangeRequestGeometry(input.id, input.role)),
    /** Current values of the targeted network, to compare with the proposal. */
    getReviewContext: adminRoute.input(z.object({ id: z.uuid() })).query(({ input }) => getNetworkChangeRequestReviewContext(input.id)),
    /** Attaches a pending request to a network (or detaches it), so it can be applied. */
    linkNetwork: adminRoute.input(zLinkNetworkChangeRequestInput).mutation(({ input }) => linkNetworkChangeRequest(input)),
    list: adminRoute.query(() => listNetworkChangeRequests()),
    /** Renames a file attached to a pending request (display name once published, the extension stays). */
    renameFile: adminRoute
      .input(z.object({ fileId: z.uuid(), filename: z.string().trim().min(1).max(200), id: z.uuid() }))
      .mutation(({ input }) => renameNetworkChangeRequestFile(input)),
    /** Replaces the files of a role by a GeoJSON converted by the admin (geometry read right away). */
    replaceGeometryFile: adminRoute
      .input(zReplaceNetworkChangeRequestGeometryFileInput)
      .mutation(({ input }) => replaceNetworkChangeRequestGeometryFile(input)),
    /** Replays the conversion job of the geo files of a pending request. */
    retryGeometryConversion: adminRoute
      .input(z.object({ id: z.uuid() }))
      .mutation(({ input }) => retryNetworkChangeRequestGeometryConversion(input.id)),
  },
  /** Public forms (modification de fiche, contribution de tracé…), rate-limited; the files were uploaded beforehand via /api/files/upload. */
  create: route
    .meta({ rateLimit: { limit: 10, windowMs: 60 * 60 * 1000 } })
    .input(zCreateNetworkChangeRequestInput)
    .mutation(({ input, ctx }) => createNetworkChangeRequest(input, { logger: ctx.logger, userId: ctx.user?.id ?? null })),
});
