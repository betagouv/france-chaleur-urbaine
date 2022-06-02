import { useFormInputAutoId } from '@hooks';
import { _hasError } from '@utils/form-utils';
import { ErrorMessage } from 'formik';
import React from 'react';

const Checkbox = ({ label, field, form, id, ...otherProps }: any) => {
  const hasError = _hasError(field.name, form);
  const additionalInputGroupClass = hasError ? 'fr-checkbox-group--error' : '';
  const inputId = useFormInputAutoId({ id, name: field.name });

  return (
    <div className={`fr-checkbox-group ${additionalInputGroupClass}`}>
      <input type={'checkbox'} id={inputId} {...otherProps} {...field} />
      <label htmlFor={inputId} className="fr-label">
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
