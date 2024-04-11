import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import { ZodRawShape, z } from 'zod';
import { parentLogger } from './logger';
import { HttpStatusCode } from 'axios';
import { errors as formidableErrors } from 'formidable';
import { captureException } from '@sentry/nextjs';
import { USER_ROLE } from 'src/types/enum/UserRole';
import { Session, getServerSession } from 'next-auth';
import { nextAuthOptions } from '@pages/api/auth/[...nextauth]';
import { BadRequestError } from 'src/services/errors';

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
  requireAuthentication?: boolean | `${USER_ROLE}`[];
};

const defaultRouteOptions = {
  logRequest: true,
  requireAuthentication: false,
} satisfies RouteOptions;

/**
 * Encapsule une route API pour logger et gérer automatiquement les erreurs :
 *  - authentification requise => retourne un statut 401
 *  - permissions invalides => retourne un statut 403
 *  - validation Zod => retourne un statut 400
 *  - erreur de route (invalidRouteError) => retourne un statut 404
 *  - postgres => retourne un statut 500
 */
export function handleRouteErrors(
  handler: NextApiHandler,
  options?: RouteOptions
): NextApiHandler {
  const routeOptions: RouteOptions = Object.assign(
    {},
    defaultRouteOptions,
    options
  );
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const startTime = Date.now();
    const logger = parentLogger.child({ url: req.url });
    try {
      if (routeOptions?.requireAuthentication) {
        await requireAuthentication(
          req,
          res,
          routeOptions.requireAuthentication
        );
      }
      const handlerResult = await handler(req, res);
      if (!res.headersSent) {
        res.status(HttpStatusCode.Ok).json(
          handlerResult ?? {
            message: 'success',
          }
        );
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
      if (error === requiredAuthenticationError) {
        logger.error('required authentication error');
        return res.status(401).json({
          message: 'Authentification requise',
        });
      }
      if (error === invalidPermissionsError) {
        logger.error('invalid permissions error');
        return res.status(403).json({
          message: 'Permissions invalides',
        });
      }
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
        if (error instanceof BadRequestError) {
          logger.error('validation error', {
            error,
          });
          return res.status(400).json({
            message: error.message,
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

export const requiredAuthenticationError = new Error(
  'Authentification requise'
); // 401
export const invalidPermissionsError = new Error('Permissions invalides'); // 403
export const invalidRouteError = new Error('invalid route'); // 404

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

export function requirePutMethod(req: NextApiRequest) {
  if (req.method !== 'PUT') {
    throw invalidRouteError;
  }
}

export function requireDeleteMethod(req: NextApiRequest) {
  if (req.method !== 'DELETE') {
    throw invalidRouteError;
  }
}

export async function requireAuthentication(
  req: NextApiRequest,
  res: NextApiResponse,
  configOrRoles: boolean | `${USER_ROLE}`[]
): Promise<Session> {
  const session = await getServerSession(req, res, nextAuthOptions);
  if (!session || !session.user) {
    throw requiredAuthenticationError;
  }
  req.user = session.user;
  if (!req.user.active) {
    throw invalidPermissionsError;
  }
  if (
    configOrRoles instanceof Array &&
    !configOrRoles.includes(req.user.role)
  ) {
    throw invalidPermissionsError;
  }
  return session;
}
