import type { NextApiRequest, NextApiResponse } from 'next';
import { ZodRawShape, z } from 'zod';

/**
 * Valide un objet selon un schéma zod.
 */
export async function validateObjectSchema<Shape extends ZodRawShape>(
  object: any,
  shape: Shape
): Promise<z.infer<z.ZodObject<Shape>>> {
  return z.strictObject(shape).parseAsync(object);
}

/**
 * Encapsule une route API et gère automatiquement les erreurs de validation Zod en retournant un statut 400 en JSON.
 */
export function handleRouteErrors(
  handler: (req: NextApiRequest, res: NextApiResponse) => any
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'ZodError') {
          return res.status(400).json({
            message: 'Paramètres incorrects',
            error: err,
          });
        }
        return res.status(500).json({
          message: 'Une erreur inconnue est survenue',
          error: err.message,
        });
      }
      return res.status(500).json({
        message: 'Une erreur inconnue est survenue',
        error: err,
      });
    }
  };
}
