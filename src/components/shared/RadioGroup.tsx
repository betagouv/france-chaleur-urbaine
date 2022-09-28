import { Radio, RadioGroup } from '@dataesr/react-dsfr';
import { _hasError } from '@utils/form-utils';
import { ErrorMessage, Field, useFormikContext } from 'formik';
import { useMemo } from 'react';
import styled from 'styled-components';

type InputObjType = {
  value: string;
  label: string;
  id: string;
};

const GroupWrapper = styled.div`
  padding-top: 0.75em;
  position: relative;
`;

function FCURadioGroup({
  label,
  name,
  inputs,
  required,
}: {
  label: string;
  name: string;
  inputs: InputObjType[];
  required?: boolean;
}) {
  const form = useFormikContext();
  const hasError = _hasError(name, form);
  const options = useMemo(
    () =>
      inputs.map(({ value, label, id }) => (
        <Field
          key={id}
          name={name}
          id={id}
          value={value}
          label={label}
          type="radio"
          component={({ field, ...props }: Record<'field' | string, any>) => (
            <Radio {...field} {...props} />
          )}
        />
      )),
    [inputs, name]
  );

  return (
    <GroupWrapper>
      <RadioGroup legend={label} name={name} required={required} isInline>
        {options}
        {hasError && (
          <ErrorMessage name={name} component={'p'} className="fr-error-text" />
        )}
      </RadioGroup>
    </GroupWrapper>
  );
}

export default FCURadioGroup;
