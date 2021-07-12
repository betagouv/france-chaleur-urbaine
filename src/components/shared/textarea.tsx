import { _hasError } from '@utils/form-utils';
import { ErrorMessage } from 'formik';
import React from 'react';

const Textarea = ({ label, field, form }: any) => {
  const additionalInputClass = _hasError(field.name, form)
    ? 'fr-input--error'
    : '';
  const additionalInputGroupClass = _hasError(field.name, form)
    ? 'fr-input-group--error'
    : '';
  return (
    <div className={`fr-input-group ${additionalInputGroupClass}`}>
      <label htmlFor={field.name} className="fr-label">
        {label}
      </label>
      <textarea
        className={`fr-input ${additionalInputClass}`}
        {...field}
        id={field.name}
      />
      {_hasError(field.name, form) && (
        <ErrorMessage name="besoin" component={'p'} className="fr-error-text" />
      )}
    </div>
  );
};

export default Textarea;
