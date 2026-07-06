import { z } from 'zod';

import { eventGranularities, eventTypes } from '@/modules/events/constants';
import { adminRoute, router } from '@/modules/trpc/server';

import * as eventsService from './service';

const zListEventsInput = z.object({
  authorIds: z.array(z.string()).optional(),
  contextId: z.string().optional(),
  contextType: z.string().optional(),
  cursor: z.number().int().min(0).default(0),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  limit: z.number().int().min(1).max(200).default(50),
  organizationId: z.string().optional(),
  types: z.array(z.enum(eventTypes)).optional(),
});

const zGetStatsInput = z.object({
  authorIds: z.array(z.string()).optional(),
  contextId: z.string().optional(),
  contextType: z.string().optional(),
  dateFrom: z.coerce.date(),
  dateTo: z.coerce.date(),
  granularity: z.enum(eventGranularities),
  organizationId: z.string().optional(),
  types: z.array(z.enum(eventTypes)).optional(),
});

const zSearchAuthorsInput = z.object({
  search: z.string().min(1),
});

export const eventsRouter = router({
  admin: {
    getAuthorsByIds: adminRoute
      .input(z.object({ ids: z.array(z.uuidv4()) }))
      .query(({ input }) => eventsService.getAuthorsByIds(input.ids)),
    getStats: adminRoute.input(zGetStatsInput).query(({ input }) =>
      eventsService.getEventStats({
        authorIds: input.authorIds,
        context: input.contextType && input.contextId ? { id: input.contextId, type: input.contextType } : undefined,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
        granularity: input.granularity,
        organizationId: input.organizationId,
        types: input.types,
      })
    ),
    list: adminRoute.input(zListEventsInput).query(({ input }) =>
      eventsService.listEvents({
        authorIds: input.authorIds,
        context: input.contextType && input.contextId ? { id: input.contextId, type: input.contextType } : undefined,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
        limit: input.limit,
        offset: input.cursor,
        organizationId: input.organizationId,
        types: input.types,
      })
    ),
    searchAuthors: adminRoute.input(zSearchAuthorsInput).query(({ input }) => eventsService.searchAuthors(input.search)),
  },
});
