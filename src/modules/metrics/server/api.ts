import { timingSafeEqual } from 'node:crypto';

import type { NextApiRequest, NextApiResponse } from 'next';

import { serverConfig } from '@/server/config';
import { handleRouteErrors, invalidRouteError, requiredAuthenticationError } from '@/server/helpers/server';

import { initMetrics, metricsRegister } from './registry';

const isAuthorized = (req: NextApiRequest, expectedToken: string): boolean => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return false;
  }

  const provided = Buffer.from(header.slice('Bearer '.length));
  const expected = Buffer.from(expectedToken);
  if (provided.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(provided, expected);
};

const GET = async (req: NextApiRequest, res: NextApiResponse) => {
  if (!serverConfig.METRICS_AUTH_TOKEN) {
    throw invalidRouteError;
  }

  if (!isAuthorized(req, serverConfig.METRICS_AUTH_TOKEN)) {
    throw requiredAuthenticationError;
  }

  initMetrics();

  res.setHeader('Content-Type', metricsRegister.contentType);
  res.status(200).send(await metricsRegister.metrics());
};

export const metricsApiHandler = handleRouteErrors({ GET }, { logRequest: false });
