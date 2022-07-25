import { useFormInputAutoId } from '@hooks';
import { TypeFormObject, _hasError } from '@utils/form-utils';
import { ErrorMessage } from 'formik';
import React from 'react';

const Select: React.FC<{
  children: React.ReactNode;
  label: React.ReactNode;
  field: { name: string };
  form: TypeFormObject;
  id: string;
}> = ({ children, label, field, form, id }) => {
  const hasError = _hasError(field.name, form);
  const additionalInputClass = hasError ? 'fr-select--error' : '';
  const additionalInputGroupClass = hasError ? 'fr-select-group--error' : '';
  const inputId = useFormInputAutoId({ id, name: field.name });

  return (
    <div className={`fr-select-group ${additionalInputGroupClass}`}>
      <label className="fr-label" htmlFor={inputId}>
        {label}
      </label>
      <select
        {...field}
        className={`fr-select ${additionalInputClass}`}
        id={inputId}
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
};

export default Select;
