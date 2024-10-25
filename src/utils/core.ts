import { FlattenKeys } from './typescript';

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
export function cloneDeep(source: any): any {
  const objectType = typeof source;
  if (objectType === 'string' || objectType === 'number' || objectType === 'boolean' || source === null || source === undefined) {
    return source;
  } else if (source instanceof Array) {
    return source.map(cloneDeep);
  } else if (source instanceof Date) {
    return new Date(source.getTime());
  } else if (objectType === 'object') {
    return Object.keys(source).reduce((clone: any, key) => {
      clone[key] = cloneDeep(source[key]);
      return clone;
    }, {});
  } else {
    throw new Error(`unknown object type: ${objectType}`);
  }
}
