import { _hasError } from '@utils/form-utils';
import { ErrorMessage } from 'formik';
import React from 'react';

const Input = ({ label, type = 'text', field, form }: any) => {
  const hasError = _hasError(field.name, form);
  const additionalInputClass = hasError ? 'fr-input--error' : '';
  const additionalInputGroupClass = hasError ? 'fr-input-group--error' : '';
  return (
    <div className={`fr-input-group ${additionalInputGroupClass}`}>
      <label htmlFor={field.name} className="fr-label">
        {label}
      </label>
      <input
        type={type}
        className={`fr-input ${additionalInputClass}`}
        {...field}
        id={field.name}
      />
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

export default Input;
