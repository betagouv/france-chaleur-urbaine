import type { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';
import { describe, expect, it, vi } from 'vitest';

import { businessRules } from '@/modules/app/business-rules';

import { LOGIN_RATE_LIMIT_MESSAGE, withLoginRateLimit } from './login-rate-limit';

vi.mock('@/server/helpers/logger', () => ({ logger: { warn: vi.fn() } }));

const callHandler = async (handler: ReturnType<typeof withLoginRateLimit>, ip: string, segments: string[], method = 'POST') => {
  const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
    headers: { 'x-real-ip': ip },
    method: method as 'POST' | 'GET',
    query: { nextauth: segments },
  });
  await handler(req, res);
  return res;
};

describe('withLoginRateLimit', () => {
  it('lets credentials sign-in through until the limit, then answers 429 with a NextAuth-shaped redirect', async () => {
    const nextAuthHandler = vi.fn(async (_req: NextApiRequest, res: NextApiResponse) => {
      res.status(200).end();
    });
    const handler = withLoginRateLimit(nextAuthHandler);

    for (let attempt = 0; attempt < businessRules.loginAttemptsLimit.value; attempt++) {
      const res = await callHandler(handler, '10.0.0.1', ['callback', 'credentials']);
      expect(res.statusCode).toStrictEqual(200);
    }
    const blocked = await callHandler(handler, '10.0.0.1', ['callback', 'credentials']);

    expect(nextAuthHandler).toHaveBeenCalledTimes(businessRules.loginAttemptsLimit.value);
    expect(blocked.statusCode).toStrictEqual(429);
    expect(blocked._getJSONData()).toStrictEqual({
      url: `/connexion?notify=error:${encodeURIComponent(LOGIN_RATE_LIMIT_MESSAGE)}`,
    });
  });

  it('counts attempts per IP', async () => {
    const nextAuthHandler = vi.fn(async (_req: NextApiRequest, res: NextApiResponse) => {
      res.status(200).end();
    });
    const handler = withLoginRateLimit(nextAuthHandler);

    for (let attempt = 0; attempt <= businessRules.loginAttemptsLimit.value; attempt++) {
      await callHandler(handler, '10.0.0.2', ['callback', 'credentials']);
    }
    const otherIp = await callHandler(handler, '10.0.0.3', ['callback', 'credentials']);

    expect(otherIp.statusCode).toStrictEqual(200);
  });

  it('does not count other NextAuth requests (session, csrf, GET)', async () => {
    const nextAuthHandler = vi.fn(async (_req: NextApiRequest, res: NextApiResponse) => {
      res.status(200).end();
    });
    const handler = withLoginRateLimit(nextAuthHandler);

    for (let attempt = 0; attempt < businessRules.loginAttemptsLimit.value * 2; attempt++) {
      await callHandler(handler, '10.0.0.4', ['session'], 'GET');
      await callHandler(handler, '10.0.0.4', ['csrf'], 'GET');
      await callHandler(handler, '10.0.0.4', ['callback', 'credentials'], 'GET');
    }
    const signIn = await callHandler(handler, '10.0.0.4', ['callback', 'credentials']);

    expect(signIn.statusCode).toStrictEqual(200);
    expect(nextAuthHandler).toHaveBeenCalledTimes(businessRules.loginAttemptsLimit.value * 2 * 3 + 1);
  });
});
