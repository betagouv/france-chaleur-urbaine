import rateLimit, { type Options } from 'express-rate-limit';
import { type NextApiRequest, type NextApiResponse } from 'next';

import { rateLimitError } from '@/server/helpers/server';

export function createRateLimiter(options?: Partial<Options>) {
  const rateLimitMiddleware = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res, next) => {
      next(new Error('rate limit'));
    },
    keyGenerator: (request) =>
      request.ip || request.headers['x-forwarded-for'] || request.headers['x-real-ip'] || request.connection.remoteAddress,
    ...options,
  });

  const expressMiddlewareToNext = (middleware: any) => (request: NextApiRequest, response: NextApiResponse) =>
    new Promise((resolve, reject) => {
      middleware(request, response, (result?: Error) => (result instanceof Error ? reject(rateLimitError) : resolve(result)));
    });

  const rateLimitRequest = expressMiddlewareToNext(rateLimitMiddleware);

  return rateLimitRequest;
}
