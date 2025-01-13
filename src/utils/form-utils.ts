import { getIn } from 'formik';

import { ObjectEntries } from '@/utils/typescript';

export type TypeFormObject = { errors: any; touched: any };

export const _hasError = (fieldName: string, { errors, touched }: TypeFormObject) =>
  !!(getIn(errors, fieldName) && getIn(touched, fieldName));

export const flattenMultipartData = (formData: any) =>
  ObjectEntries(formData).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [key]: parseValue(value?.[0]),
    }),
    {}
  );

export const parseValue = (value: any): boolean | string => {
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  return value;
};
