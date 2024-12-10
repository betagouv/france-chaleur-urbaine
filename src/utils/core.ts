import { ObjectKeys, type FlattenKeys } from './typescript';

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
    if (obj2[key] !== null && typeof obj2[key] === 'object' && !Array.isArray(obj2[key])) {
      if (key in result && typeof result[key] === 'object' && !Array.isArray(result[key])) {
        result[key] = deepMergeObjects(result[key], obj2[key]);
      } else {
        result[key] = { ...obj2[key] };
      }
    } else {
      result[key] = obj2[key];
    }
  }

  return result;
}

/**
 * Deeply clone an object.
 */
export function cloneDeep<Type>(source: Type): Type {
  const objectType = typeof source;
  if (objectType === 'string' || objectType === 'number' || objectType === 'boolean' || source === null || source === undefined) {
    return source;
  } else if (source instanceof Array) {
    return source.map(cloneDeep) as Type;
  } else if (source instanceof Date) {
    return new Date(source.getTime()) as Type;
  } else if (objectType === 'object') {
    return ObjectKeys(source).reduce((clone: any, key) => {
      clone[key] = cloneDeep(source[key]);
      return clone;
    }, {});
  } else {
    throw new Error(`unknown object type: ${objectType}`);
  }
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
