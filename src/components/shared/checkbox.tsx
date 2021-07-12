import { _hasError } from '@utils/form-utils';
import { ErrorMessage } from 'formik';
import React from 'react';

const Checkbox = ({ label, field, form }: any) => {
  const hasError = _hasError(field.name, form);
  const additionalInputGroupClass = hasError ? 'fr-checkbox-group--error' : '';
  return (
    <div className={`fr-checkbox-group ${additionalInputGroupClass}`}>
      <input type={'checkbox'} id={field.name} {...field} />
      <label htmlFor={field.name} className="fr-label">
        {label}
      </label>
      {hasError && (
        <ErrorMessage
          name={field.name}
          component={'p'}
          className="fr-error-text"
        />
      )}
    </div>
  );
};
export default Checkbox;
