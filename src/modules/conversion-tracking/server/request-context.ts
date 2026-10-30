import type { IncomingHttpHeaders } from 'node:http';
import { isIP } from 'node:net';

import { isbot } from 'isbot';

import { getClientIp } from '@/server/helpers/request-ip';

export type TrackingRequestContext = {
  /** Validated client IP (`inet`-safe), `null` when unavailable or malformed. */
  ip: string | null;
  userAgent: string | null;
  /** Crawler user-agent: the caller drops the event silently (bots run the JS of internal pages). */
  isBot: boolean;
};

/**
 * Anti-abuse context of a first-party tracking request (conversion events, renewable heating simulations):
 * the single rule for extracting IP / user-agent and detecting crawlers, shared by every public tracking route.
 */
export function getTrackingRequestContext(ctx: {
  headers: IncomingHttpHeaders;
  req: { headers: IncomingHttpHeaders; socket?: { remoteAddress?: string | null } };
}): TrackingRequestContext {
  const userAgent = ctx.headers['user-agent'];
  const ip = getClientIp(ctx.req);
  return {
    ip: ip && isIP(ip) ? ip : null,
    isBot: typeof userAgent === 'string' && isbot(userAgent),
    userAgent: typeof userAgent === 'string' ? userAgent : null,
  };
}
