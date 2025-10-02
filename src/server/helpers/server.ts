import { captureException } from '@sentry/nextjs';
import { HttpStatusCode } from 'axios';
import { errors as formidableErrors } from 'formidable';
import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import type { User } from 'next-auth';
import { type ZodRawShape, z } from 'zod';

import { rateLimitError } from '@/modules/security/server/rate-limit';
import { getServerSession } from '@/server/authentication';
import type { UserRole } from '@/types/enum/UserRole';

import { parentLogger } from './logger';

const FormidableError = (formidableErrors as any).default;

export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BadRequestError';
  }
}

/**
 * Valide un objet selon un schéma zod.
 */
export async function validateObjectSchema<Shape extends ZodRawShape>(object: any, shape: Shape): Promise<z.infer<z.ZodObject<Shape>>> {
  return z.strictObject(shape).parseAsync(object);
}

type RouteOptions = {
  logRequest?: boolean;
  requireAuthentication?: boolean | UserRole[];
};

const defaultRouteOptions = {
  logRequest: true,
  requireAuthentication: false,
} satisfies RouteOptions;

type RequestMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' | 'OPTIONS';

/**
 * Encapsule une route API pour logger et gérer automatiquement les erreurs :
 *  - authentification requise => retourne un statut 401
 *  - permissions invalides => retourne un statut 403
 *  - validation Zod => retourne un statut 400
 *  - erreur de route (invalidRouteError) => retourne un statut 404
 *  - postgres => retourne un statut 500
 */
export function handleRouteErrors<HandlersConfig extends Partial<Record<RequestMethod, NextApiHandler>>>(
  handlerOrHandlers: NextApiHandler | HandlersConfig,
  options?: RouteOptions
): NextApiHandler {
  const routeOptions: RouteOptions = Object.assign({}, defaultRouteOptions, options);
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const startTime = Date.now();
    let logger = parentLogger.child({
      ip: process.env.LOG_REQUEST_IP ? (req.headers['x-forwarded-for'] ?? req.socket.remoteAddress) : undefined,
      method: req.method,
      url: req.url,
    });
    try {
      req.session = await getServerSession({ req, res });
      req.user = req.session?.user;
      logger = logger.child({
        user: process.env.LOG_REQUEST_USER ? req.user?.id : undefined,
      });
      if (routeOptions?.requireAuthentication) {
        requireAuthentication(req.user, routeOptions.requireAuthentication);
      }

      // handle preflight requests
      if (req.method === 'OPTIONS') {
        res.status(HttpStatusCode.Ok).end();
      } else {
        const handler = typeof handlerOrHandlers === 'function' ? handlerOrHandlers : handlerOrHandlers[req.method as RequestMethod];
        if (!handler) {
          throw invalidRouteError;
        }
        const handlerResult = await handler(req, res);
        if (!res.headersSent) {
          res.status(HttpStatusCode.Ok).json(
            handlerResult ?? {
              message: 'success',
            }
          );
        }
      }
      if (routeOptions.logRequest) {
        logger.info('request completed', { duration: Date.now() - startTime });
      }
    } catch (error: any) {
      captureException(error);
      if (error instanceof FormidableError) {
        logger.error('formidable error', {
          code: error.code,
          error: error.message,
          httpCode: error.httpCode,
        });
        return res.status(error.httpCode ?? 400).json({
          error: error.message,
          message: 'Paramètres incorrects',
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
      if (error === rateLimitError) {
        logger.error('rate limit error');
        return res.status(429).json({
          message: error.message,
        });
      }
      if (error instanceof Error) {
        if (error.name === 'ZodError') {
          logger.error('validation error', {
            error,
          });
          return res.status(400).json({
            error,
            message: 'Paramètres incorrects',
          });
        }
        if (error instanceof BadRequestError) {
          logger.error('validation error', {
            error,
          });
          return res.status(400).json({
            error,
            message: error.message,
          });
        }

        if ((error as any).routine) {
          // Check for unique constraint violation (error code 23505)
          if ((error as any).code === '23505') {
            logger.error('unique constraint violation', {
              error,
              query: error.message,
            });
            return res.status(400).json({
              code: 'unique_constraint_violation',
              error: error.message,
              message: 'Cette entrée existe déjà',
            });
          }

          logger.error('database error', {
            error,
            query: error.message,
          });
          return res.status(500).json({
            error: error.message,
            message: 'Une erreur inconnue est survenue',
          });
        }
        errorMessage = error.message;
      }
      logger.error('unknown error', {
        error: errorMessage,
        stack: (error as any).stack,
      });
      return res.status(500).json({
        error: errorMessage,
        message: 'Une erreur inconnue est survenue',
      });
    }
  };
}

export const requiredAuthenticationError = new Error('Authentification requise'); // 401
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

export function requireAuthentication(user: User, configOrRoles: boolean | UserRole[]) {
  if (!user) {
    throw requiredAuthenticationError;
  }
  if (!user.active) {
    throw invalidPermissionsError;
  }
  if (Array.isArray(configOrRoles) && !(configOrRoles.some((routeRole) => user.role === routeRole) || user.role === 'admin')) {
    throw invalidPermissionsError;
  }
}
