import { ZodArray, ZodIntersection, ZodObject, ZodPipe, type ZodRawShape, type ZodType, ZodUnion, z } from 'zod';

import { businessRules } from '@/modules/app/business-rules';

/**
 * Recursively unwraps zod v4 wrapper schemas — pipes/transforms (input side),
 * optional, nullable, default, catch… — down to the underlying schema.
 */
const unwrapSchema = (schema: ZodType): ZodType => {
  let currentSchema = schema;
  while (true) {
    if (currentSchema instanceof ZodPipe) {
      currentSchema = currentSchema.in as ZodType; // forms validate the input side of a .transform()/.pipe()
      continue;
    }
    if (currentSchema instanceof ZodObject || currentSchema instanceof ZodArray) {
      return currentSchema;
    }
    const wrapper = currentSchema as ZodType & { unwrap?: () => ZodType };
    if (typeof wrapper.unwrap !== 'function') {
      return currentSchema;
    }
    currentSchema = wrapper.unwrap();
  }
};

/**
 * Shape of an object-like schema: plain object, intersection of object-likes
 * (shapes merged), or (discriminated) union of object-likes (branch shapes
 * merged — a field is looked up in whichever branch defines it).
 */
const getObjectShape = (schema: ZodType): ZodRawShape | undefined => {
  const unwrapped = unwrapSchema(schema);
  if (unwrapped instanceof ZodObject) {
    return unwrapped.shape;
  }
  if (unwrapped instanceof ZodIntersection) {
    const leftShape = getObjectShape(unwrapped.def.left as ZodType);
    const rightShape = getObjectShape(unwrapped.def.right as ZodType);
    return leftShape || rightShape ? { ...leftShape, ...rightShape } : undefined;
  }
  if (unwrapped instanceof ZodUnion) {
    const optionShapes = (unwrapped.options as ZodType[]).map(getObjectShape).filter(isDefinedShape);
    return optionShapes.length > 0 ? Object.assign({}, ...optionShapes) : undefined;
  }
  return undefined;
};

const isDefinedShape = (shape: ZodRawShape | undefined): shape is ZodRawShape => shape !== undefined;

/**
 * Resolves the sub-schema of a (possibly nested) field path, traversing objects,
 * arrays, intersections and wrappers (refine/transform/optional/nullable…).
 */
export const getSchemaField = (schema: ZodType, fieldPath: string): ZodType | undefined => {
  if (!schema || !fieldPath) return undefined;

  const normalizedPath = fieldPath
    .replace(/\[\d+\]/g, '')
    .split('.')
    .filter(Boolean);

  let currentSchema: ZodType = schema;

  for (const pathSegment of normalizedPath) {
    const unwrapped = unwrapSchema(currentSchema);
    const containerSchema = unwrapped instanceof ZodArray ? unwrapSchema(unwrapped.element as ZodType) : unwrapped;
    const fieldSchema = getObjectShape(containerSchema)?.[pathSegment];
    if (!fieldSchema) {
      return undefined;
    }
    currentSchema = fieldSchema as ZodType;
  }

  return currentSchema;
};

export const zAirtableRecordId = z.string().regex(/^[a-zA-Z0-9]{17}$/); // e.g. rec6nCFUO7Nzj6M9n

// Length only, no composition rule (ANSSI: length beats forced character classes; a passphrase is encouraged in the UI hint)
export const zPassword = z
  .string()
  .min(businessRules.passwordMinLength.value, `Le mot de passe doit contenir au moins ${businessRules.passwordMinLength.display}.`)
  .max(100, 'Le mot de passe ne peut pas dépasser 100 caractères.');

// Shown under the password field of creation forms (registration, reset): passphrases over forced symbols
export const passwordHint = `${businessRules.passwordMinLength.display} minimum, sans autre contrainte. Conseil : une phrase facile à retenir, par exemple plusieurs mots sans lien entre eux.`;

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
