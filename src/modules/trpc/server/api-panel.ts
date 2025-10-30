import type { NextApiRequest, NextApiResponse } from 'next';

import { appRouter } from '../trpc.config';

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV !== 'development') {
    res.status(404).end('Not Found');
    return;
  }

  const { renderTrpcPanel } = await import('trpc-ui');

  const html = renderTrpcPanel(appRouter, {
    transformer: 'superjson', // Enabled by default with create-t3-app
    url: '/api/trpc', // Default trpc route in nextjs
  });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:;");
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  return res.status(200).send(html);
}
