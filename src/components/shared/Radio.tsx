import { _hasError } from '@utils/form-utils';
import { ErrorMessage } from 'formik';
import React from 'react';
import styled from 'styled-components';

const FrRadioGroup = styled.span`
  display: inline-flex;
  padding-right: 1em;
`;

const Radio = ({ label, field, form, id, value, displayError }: any) => {
  const hasError = _hasError(field.name, form);
  const additionalInputGroupClass = hasError ? 'fr-checkbox-group--error' : '';
  return (
    <FrRadioGroup className={`fr-radio-group ${additionalInputGroupClass}`}>
      <input
        type={'radio'}
        id={id}
        {...field}
        value={value}
        checked={field.value === value}
      />
      <label htmlFor={id} className="fr-label">
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
