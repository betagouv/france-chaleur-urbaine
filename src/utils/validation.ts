import { ZodObject, type ZodRawShape, type ZodTypeAny, z } from 'zod';

/**
 * Recursively unwraps ZodEffects to get the base schema.
 */
const unwrapSchema = (schema: ZodTypeAny): ZodTypeAny => {
  while ((schema._def as any).typeName === 'ZodEffects') {
    schema = (schema as any)._def.schema;
  }
  return schema;
};

/**
 * Extracts the shape from a ZodObject schema, even if it's wrapped in effects.
 */
export const getSchemaShape = (schema: ZodTypeAny): ZodRawShape => {
  if (!schema) return {} as ZodRawShape;

  // Unwrap schema from ZodEffects layers
  const unwrappedSchema = unwrapSchema(schema);

  // If it's a ZodObject, return its shape
  if (unwrappedSchema instanceof ZodObject) {
    return unwrappedSchema.shape;
  }

  return {} as ZodRawShape;
};

export const zAirtableRecordId = z.string().regex(/^[a-zA-Z0-9]{17}$/); // e.g. rec6nCFUO7Nzj6M9n

export const zPassword = z.string().refine(
  (password) => {
    if (password.length < 8) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    return true;
  },
  {
    error: 'Le mot de passe doit contenir au moins 8 caractères, une lettre minuscule, une lettre majuscule et un chiffre.',
  }
);

export const emailSchema = z.string().trim().toLowerCase().email('Invalid email address');

export const sanitizeEmail = (email: string): string => emailSchema.safeParse(email)?.data ?? email;

/**
 * Parses a boolean from an environment variable.
 *
 * @example
 * ENABLE_INSCRIPTIONS=true
 * ENABLE_INSCRIPTIONS=1
 * ENABLE_INSCRIPTIONS=0
 * ENABLE_INSCRIPTIONS=false
 */
export const envBooleanSchema = z
  .enum(['0', '1', 'true', 'false'])
  .catch('false')
  .transform((value) => value === 'true' || value === '1');

export type AllowedGeometry = GeoJSON.Feature<GeoJSON.Point | GeoJSON.LineString | GeoJSON.Polygon>;

// Simple geometry validation - actual processing is done in processGeometry
export const zGeometry = z.any().refine(
  (val) => {
    if (!val || typeof val !== 'object') return false;
    const type = (val as any).type;
    return (
      type === 'FeatureCollection' ||
      type === 'GeometryCollection' ||
      type === 'Point' ||
      type === 'LineString' ||
      type === 'Polygon' ||
      type === 'MultiPoint' ||
      type === 'MultiLineString' ||
      type === 'MultiPolygon'
    );
  },
  { error: 'Invalid GeoJSON geometry' }
);
