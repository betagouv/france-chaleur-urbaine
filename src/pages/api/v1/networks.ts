import { handleRouteErrors, requireGetMethod } from '@helpers/server';
import { Network } from 'src/types/Summary/Network';
import db from 'src/db';
import { rateLimit } from 'express-rate-limit';
import { NextApiResponse } from 'next';
import { NextApiRequest } from 'next';

// disable the warning for this route as the result is big > 50MB
export const config = {
  api: {
    responseLimit: false,
  },
};

const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next) => {
    next(new Error('rate limit'));
  },
  keyGenerator: (request) =>
    request.ip ||
    request.headers['x-forwarded-for'] ||
    request.headers['x-real-ip'] ||
    request.connection.remoteAddress,
});

const expressMiddlewareToNext =
  (middleware: any) => (request: NextApiRequest, response: NextApiResponse) =>
    new Promise((resolve, reject) => {
      middleware(request, response, (result?: Error) =>
        result instanceof Error ? reject(result) : resolve(result)
      );
    });

const rateLimitRequest = expressMiddlewareToNext(rateLimitMiddleware);

export default handleRouteErrors(async (req, res) => {
  requireGetMethod(req);
  try {
    await rateLimitRequest(req, res);
  } catch {
    return res.status(429).send({
      message: 'rate limit',
      error: 'too many requests',
    });
  }

  const reseaux = await Promise.all([
    db<Network>('reseaux_de_chaleur').select([
      'id_fcu',
      'Identifiant reseau',
      'nom_reseau',
      'Gestionnaire',
      'Taux EnR&R',
      'contenu CO2',
      'contenu CO2 ACV',
      db.raw('st_asgeojson(st_transform(geom, 4326))::jsonb as geom'),
    ]),
    db<Network>('reseaux_de_froid').select([
      'id_fcu',
      'Identifiant reseau',
      'nom_reseau',
      'Gestionnaire',
      'Taux EnR&R',
      'contenu CO2',
      'contenu CO2 ACV',
      db.raw('st_asgeojson(st_transform(geom, 4326))::jsonb as geom'),
    ]),
  ]);
  return reseaux.flat();
});
