import { _hasError } from '@utils/form-utils';
import { ErrorMessage } from 'formik';
import React from 'react';

function Select({ label, field, form, children }: any) {
  const hasError = _hasError(field.name, form);
  const additionalInputClass = hasError ? 'fr-select--error' : '';
  const additionalInputGroupClass = hasError ? 'fr-select-group--error' : '';
  return (
    <div className={`fr-select-group ${additionalInputGroupClass}`}>
      <label className="fr-label" htmlFor={field.name}>
        {label}
      </label>
      <select
        {...field}
        className={`fr-select ${additionalInputClass}`}
        id={field.name}
      >
        {children}
      </select>
      {hasError && (
        <ErrorMessage
          name={field.name}
          component={'p'}
          className="fr-error-text"
        />
      )}
    </div>
  );
}

export default Select;
