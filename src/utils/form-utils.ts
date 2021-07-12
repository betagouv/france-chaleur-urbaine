import { getIn } from 'formik';

export const _hasError = (fieldName: string, { errors, touched }: any) =>
  !!(getIn(errors, fieldName) && getIn(touched, fieldName));
