import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import { ZodRawShape, z } from 'zod';
import { parentLogger } from './logger';
import { HttpStatusCode } from 'axios';
import { errors as formidableErrors } from 'formidable';
import { captureException } from '@sentry/nextjs';

const FormidableError = (formidableErrors as any).default;
/**
 * Valide un objet selon un schéma zod.
 */
export async function validateObjectSchema<Shape extends ZodRawShape>(
  object: any,
  shape: Shape
): Promise<z.infer<z.ZodObject<Shape>>> {
  return z.strictObject(shape).parseAsync(object);
}

type RouteOptions = {
  logRequest?: boolean;
};

const defaultRouteOptions = {
  logRequest: true,
} satisfies RouteOptions;

/**
 * Encapsule une route API pour logger et gérer automatiquement les erreurs :
 *  - validation Zod => retourne un statut 400
 *  - postgres => retourne un statut 500
 */
export function handleRouteErrors(
  handler: NextApiHandler,
  options?: RouteOptions
): NextApiHandler {
  const routeOptions = Object.assign({}, defaultRouteOptions, options);
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const startTime = Date.now();
    const logger = parentLogger.child({ url: req.url });
    try {
      const handlerResult = await handler(req, res);
      if (!res.headersSent) {
        res.status(HttpStatusCode.Ok).json(handlerResult);
      }
      if (routeOptions.logRequest) {
        logger.info('request completed', { duration: Date.now() - startTime });
      }
    } catch (error: any) {
      captureException(error);
      if (error instanceof FormidableError) {
        logger.error('formidable error', {
          error: error.message,
          code: error.code,
          httpCode: error.httpCode,
        });
        return res.status(error.httpCode ?? 400).json({
          message: 'Paramètres incorrects',
          error: error.message,
        });
      }
      let errorMessage = error;
      if (error === invalidRouteError) {
        logger.error('invalid route error');
        return res.status(404).json({
          message: 'URL inconnue',
        });
      }
      if (error instanceof Error) {
        if (error.name === 'ZodError') {
          logger.error('validation error', {
            error,
          });
          return res.status(400).json({
            message: 'Paramètres incorrects',
            error: error,
          });
        }

        if ((error as any).routine) {
          logger.error('database error', {
            error: error,
            query: error.message,
          });
          return res.status(500).json({
            message: 'Une erreur inconnue est survenue',
            error: error.message,
          });
        }
        errorMessage = error.message;
      }
      logger.error('unknown error', {
        error: errorMessage,
        stack: (error as any).stack,
      });
      return res.status(500).json({
        message: 'Une erreur inconnue est survenue',
        error: errorMessage,
      });
    }
  };
}

const invalidRouteError = new Error('invalid route'); // 404

export function requireGetMethod(req: NextApiRequest) {
  if (req.method !== 'GET') {
    throw invalidRouteError;
  }
}

export function requirePostMethod(req: NextApiRequest) {
  if (req.method !== 'POST') {
    throw invalidRouteError;
  }
}
