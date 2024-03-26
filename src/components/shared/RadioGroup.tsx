import { Radio, RadioGroup } from '@codegouvfr/react-dsfr';
import { _hasError } from '@utils/form-utils';
import { ErrorMessage, Field, useFormikContext } from 'formik';
import { useMemo } from 'react';

type InputObjType = {
  value: string;
  label: string;
  id: string;
};

function FCURadioGroup({
  label,
  name,
  inputs,
  required,
  isInline,
}: {
  label: string;
  name: string;
  inputs: InputObjType[];
  required?: boolean;
  isInline?: boolean;
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
    <RadioGroup
      legend={label}
      name={name}
      required={required}
      isInline={isInline}
    >
      {options}
      {hasError && (
        <ErrorMessage name={name} component={'p'} className="fr-error-text" />
      )}
    </RadioGroup>
  );
}

export default FCURadioGroup;
