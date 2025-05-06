import { type FlattenKeys } from './typescript';

export function isDefined<Type>(value: Type | undefined | null): value is Type {
  return value !== undefined && value !== null;
}

/**
 * Toggle a boolean (nested) property in a object.
 */
export function toggleBoolean<Obj extends Record<string, any>>(obj: Obj, path: FlattenKeys<Obj>) {
  const nestedProperties = path.split('.');

  nestedProperties.reduce((parentObj, key, i) => {
    if (parentObj[key] === undefined) {
      (parentObj[key] as any) = {};
    }
    if (i === nestedProperties.length - 1) {
      (parentObj[key] as any) = !parentObj[key];
    }
    return parentObj[key];
  }, obj);
}

/**
 * Deeply gets a property from an object by a dot-notated path.
 */
export function getProperty<Obj extends Record<string, any>, T = any>(obj: Obj, path?: FlattenKeys<Obj>): T | undefined {
  return (path || '').split('.').reduce((current: any, key: string) => {
    return current ? current[key] : undefined; // Safely access the property
  }, obj);
}

/**
 * Deeply sets a property in an object.
 */
export function setProperty<Obj extends Record<string, any>>(obj: Obj, path: FlattenKeys<Obj>, value: any) {
  const nestedProperties = path.split('.');

  nestedProperties.reduce((parentObj, key, i) => {
    if (parentObj[key] === undefined) {
      (parentObj[key] as any) = {};
    }
    if (i === nestedProperties.length - 1) {
      (parentObj[key] as any) = value;
    }
    return parentObj[key];
  }, obj);
}

/**
 * Deeply merge 2 objects in a new one.
 */
export function deepMergeObjects<T, U>(obj1: T, obj2: U): T & U {
  const result: any = cloneDeep(obj1);

  for (const key in obj2) {
    if (obj2[key] !== null && typeof obj2[key] === 'object') {
      if (Array.isArray(obj2[key])) {
        // Handle arrays by cloning them
        result[key] = cloneDeep(obj2[key]);
      } else if (key in result && typeof result[key] === 'object') {
        // Recursively merge objects
        result[key] = deepMergeObjects(result[key], obj2[key]);
      } else {
        // Clone objects that don't exist in result
        result[key] = cloneDeep(obj2[key]);
      }
    } else {
      // Handle primitive values
      result[key] = obj2[key];
    }
  }

  return result;
}

/**
 * Deeply clone an object.
 */
export function cloneDeep<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    if (typeof value === 'function') {
      return value.bind(null) as unknown as T;
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => cloneDeep(item)) as unknown as T;
  }

  if (value instanceof Date) {
    return new Date(value.getTime()) as unknown as T;
  }

  if (value instanceof Map) {
    const mapClone = new Map();
    value.forEach((v, k) => {
      mapClone.set(k, cloneDeep(v));
    });
    return mapClone as unknown as T;
  }

  if (value instanceof Set) {
    const setClone = new Set();
    value.forEach((v) => {
      setClone.add(cloneDeep(v));
    });
    return setClone as unknown as T;
  }

  const clone: Record<string, any> = {};
  for (const key in value) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      clone[key] = cloneDeep(value[key]);
    }
  }
  return clone as T;
}

/**
 * Extrait un sous-ensemble de propriétés spécifiques d'un objet.
 *
 * @param obj L'objet source à partir duquel les propriétés seront extraites.
 * @param keys Un tableau contenant les clés des propriétés à sélectionner.
 * @returns Un nouvel objet ne contenant que les propriétés spécifiées.
 */
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}

/**
 * Vérifie si un objet est vide (ne contient aucune propriété).
 *
 * @param obj L'objet à tester.
 * @returns `true` si l'objet est vide, sinon `false`.
 */
export function isEmptyObject(obj: object): boolean {
  return Object.keys(obj).length === 0;
}

/**
 * Vérifie si une valeur est un UUID PostGreSQL.
 *
 * @param id La valeur à vérifier.
 * @returns `true` si la valeur est un UUID PostGreSQL, sinon `false`.
 */
export const isUUID = (id: unknown): id is string =>
  typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
