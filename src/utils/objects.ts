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

export const getChanges = <T extends Record<string, any>>(newObject: T, previousObject: T) => {
  const differences = diff(previousObject, newObject);

  return getChangedFields(differences);
};
