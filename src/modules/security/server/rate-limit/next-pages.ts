import type { NextApiRequest, NextApiResponse } from 'next';

import { createRateLimiter, rateLimitError } from '../rate-limit';
/**
 * Wrapper pour utiliser le rate limiter dans Next.js API routes
 */
export function createNextApiRateLimiter(options: Parameters<typeof createRateLimiter>[0]) {
  const rateLimitMiddleware = createRateLimiter(options);

  const expressMiddlewareToNext = (middleware: any) => (request: NextApiRequest, response: NextApiResponse) =>
    new Promise((resolve, reject) => {
      middleware(request, response, (result?: Error) => (result instanceof Error ? reject(rateLimitError) : resolve(result)));
    });

  return expressMiddlewareToNext(rateLimitMiddleware);
}
