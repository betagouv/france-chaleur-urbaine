import { _hasError } from '@utils/form-utils';
import { ErrorMessage, Field, useFormikContext } from 'formik';
import React from 'react';
import styled from 'styled-components';
import Radio from './Radio';

type InputObjType = {
  value: string;
  label: string;
  id: string;
};

const GroupWrapper = styled.div`
  padding-top: 0.75em;
  position: relative;
`;

function RadioGroup({
  label,
  name,
  inputs,
}: {
  label: string;
  name: string;
  inputs: InputObjType[];
}) {
  const form = useFormikContext();
  const hasError = _hasError(name, form);

  return (
    <GroupWrapper>
      <div>{label}</div>
      <div>
        {inputs.map(({ value, label, id }) => (
          <Field
            key={id}
            name={name}
            id={id}
            value={value}
            label={label}
            component={Radio}
          />
        ))}
        {hasError && (
          <ErrorMessage name={name} component={'p'} className="fr-error-text" />
        )}
      </div>
    </GroupWrapper>
  );
}

export default RadioGroup;
