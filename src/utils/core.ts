import { FlattenKeys } from './typescript';

export function isDefined<Type>(value: Type | undefined | null): value is Type {
  return value !== undefined && value !== null;
}

/**
 * Toggle a boolean (nested) property in a object.
 */
export function toggleBoolean<Obj extends Record<string, any>>(
  obj: Obj,
  path: FlattenKeys<Obj>
) {
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
 * Deeply sets a property in an object.
 */
export function setProperty<Obj extends Record<string, any>>(
  obj: Obj,
  path: FlattenKeys<Obj>,
  value: any
) {
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
  const result: any = { ...obj1 };

  for (const key in obj2) {
    if (
      obj2[key] !== null &&
      typeof obj2[key] === 'object' &&
      !Array.isArray(obj2[key])
    ) {
      if (
        key in result &&
        typeof result[key] === 'object' &&
        !Array.isArray(result[key])
      ) {
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
