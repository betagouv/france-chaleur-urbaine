import { useFormInputAutoId } from '@hooks';
import { _hasError } from '@utils/form-utils';
import { ErrorMessage } from 'formik';
import React from 'react';
import styled from 'styled-components';

const FrRadioGroup = styled.span`
  display: inline-flex;
  padding-right: 1em;
`;

const Radio = ({
  label,
  field,
  form,
  id,
  value,
  displayError,
  ...otherProps
}: any) => {
  const hasError = _hasError(field.name, form);
  const additionalInputGroupClass = hasError ? 'fr-checkbox-group--error' : '';
  const inputId = useFormInputAutoId({ id, name: field.name });

  return (
    <FrRadioGroup className={`fr-radio-group ${additionalInputGroupClass}`}>
      <input
        type={'radio'}
        id={inputId}
        {...otherProps}
        {...field}
        value={value}
        checked={field.value === value}
      />
      <label htmlFor={inputId} className="fr-label">
        {label}
      </label>

      {displayError && hasError && (
        <ErrorMessage
          name={field.name}
          component={'p'}
          className="fr-error-text"
        />
      )}
    </FrRadioGroup>
  );
};
export default Radio;
