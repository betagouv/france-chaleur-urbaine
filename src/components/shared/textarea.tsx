import { useFormInputAutoId } from '@hooks';
import { _hasError } from '@utils/form-utils';
import { ErrorMessage } from 'formik';
import React from 'react';

const Textarea = ({ label, field, form, placeholder, id }: any) => {
  const additionalInputClass = _hasError(field.name, form)
    ? 'fr-input--error'
    : '';
  const additionalInputGroupClass = _hasError(field.name, form)
    ? 'fr-input-group--error'
    : '';
  const inputId = useFormInputAutoId({ id, name: field.name });

  return (
    <div className={`fr-input-group ${additionalInputGroupClass}`}>
      <label htmlFor={inputId} className="fr-label">
        {label}
      </label>
      <textarea
        className={`fr-input ${additionalInputClass}`}
        {...field}
        id={inputId}
        placeholder={placeholder}
      />
      {_hasError(field.name, form) && (
        <ErrorMessage
          name={field.name}
          component={'p'}
          className="fr-error-text"
        />
      )}
    </div>
  );
};

export default Textarea;
