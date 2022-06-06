import { useFormInputAutoId } from '@hooks';
import { _hasError } from '@utils/form-utils';
import { ErrorMessage } from 'formik';
import React from 'react';

const Input = ({
  label,
  type = 'text',
  field,
  form,
  required,
  id,
  ...otherProps
}: any) => {
  const hasError = _hasError(field.name, form);
  const additionalInputClass = hasError ? 'fr-input--error' : '';
  const additionalInputGroupClass = hasError ? 'fr-input-group--error' : '';
  const inputId = useFormInputAutoId({ id, name: field.name });

  return (
    <div className={`fr-input-group ${additionalInputGroupClass}`}>
      <label htmlFor={inputId} className="fr-label" data-required={required}>
        {label}
      </label>
      <input
        type={type}
        className={`fr-input ${additionalInputClass}`}
        id={inputId}
        {...field}
        {...otherProps}
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
