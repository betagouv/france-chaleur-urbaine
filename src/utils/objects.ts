import { diff } from 'deep-object-diff';

const getChangedFields = (obj: any, prefix = '') => {
  const changedFields: { path: string; value: any }[] = [];
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    const newPrefix = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'object' && value !== null) {
      // If the value is an object, recursively get changed fields
      changedFields.push(...getChangedFields(value, newPrefix));
    } else {
      changedFields.push({ path: newPrefix, value });
    }
  }
  return changedFields;
};

export const getObjectDifferences = <T extends Record<string, any>>(newObject: T, previousObject: T) => {
  const differences = diff(previousObject, newObject);

  return getChangedFields(differences);
};

export function deepIntersection<T extends object, U extends object>(
  obj1: T,
  obj2: U,
  options: {
    keepArray?: boolean;
  } = {}
): Partial<U> {
  const { keepArray = false } = options;

  function intersectionHelper(o1: any, o2: any): any {
    if (typeof o1 !== 'object' || typeof o2 !== 'object' || o1 === null || o2 === null) {
      return o1 !== o2 ? o2 : undefined;
    }

    if (Array.isArray(o1) && Array.isArray(o2)) {
      if (JSON.stringify(o1) === JSON.stringify(o2)) return undefined;
      return keepArray ? o2 : o2.map((item, index) => intersectionHelper(o1[index], item)).filter(Boolean);
    }

    const result = Object.entries(o2).reduce(
      (acc, [key, value]) => {
        const intersectedValue = intersectionHelper(o1[key], value);
        if (intersectedValue !== undefined) {
          acc[key] = intersectedValue;
        }
        return acc;
      },
      {} as Record<string, any>
    );

    return Object.keys(result).length ? result : undefined;
  }

  return intersectionHelper(obj1, obj2) || ({} as T);
}
