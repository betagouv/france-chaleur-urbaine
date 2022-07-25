import { getIn } from 'formik';

export type TypeFormObject = { errors: any; touched: any };

export const _hasError = (
  fieldName: string,
  { errors, touched }: TypeFormObject
) => !!(getIn(errors, fieldName) && getIn(touched, fieldName));
