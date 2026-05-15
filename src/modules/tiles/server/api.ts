import type { NextApiRequest, NextApiResponse } from 'next';
import zod from 'zod';

import { handleRouteErrors, requireAuthentication, validateObjectSchema } from '@/server/helpers/server';

import { getTile, getTileLastModified } from './service';
import { getCacheControlHeader, getTileSourceConfig, zTileSourceId } from './tiles.config';

const GET = async (req: NextApiRequest, res: NextApiResponse) => {
  const {
    type,
    tileCoordinates: [z, x, y],
  } = await validateObjectSchema(req.query, {
    tileCoordinates: zod.array(zod.coerce.number()).length(3),
    type: zTileSourceId,
  });

  const isPrivate = getTileSourceConfig(type).cacheProfile === 'private';
  if (isPrivate) {
    requireAuthentication(req.user, ['admin']);
  }

  const lastModified = await getTileLastModified(type);
  const etag = lastModified ? `W/"${type}-${lastModified.getTime()}"` : undefined;

  res.setHeader('Cache-Control', getCacheControlHeader(type));
  if (etag) {
    res.setHeader('ETag', etag);
  }
  if (lastModified) {
    res.setHeader('Last-Modified', lastModified.toUTCString());
  }
  if (!isPrivate) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  if (etag && req.headers['if-none-match'] === etag) {
    res.status(304).end();
    return;
  }
  if (lastModified && req.headers['if-modified-since']) {
    const ifModifiedSinceSeconds = Math.floor(new Date(req.headers['if-modified-since']).getTime() / 1000);
    const lastModifiedSeconds = Math.floor(lastModified.getTime() / 1000);
    if (Number.isFinite(ifModifiedSinceSeconds) && ifModifiedSinceSeconds >= lastModifiedSeconds) {
      res.status(304).end();
      return;
    }
  }

  const tile = await getTile(type, x, y, z);
  if (!tile) {
    res.status(204).end();
    return;
  }

  if (tile.compressed) {
    res.setHeader('Content-Encoding', 'gzip');
  }
  res.setHeader('Content-Type', 'application/protobuf');
  res.status(200).send(tile.data);
};

export default handleRouteErrors(
  { GET },
  {
    logRequest: false,
  }
);
