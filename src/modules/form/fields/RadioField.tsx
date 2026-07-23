import DsfrRadio, { type RadioProps as DsfrRadioProps } from '@/components/form/dsfr/Radio';

import { useFieldContext } from '../form-contexts';
import { useFieldErrorState, useFieldIsRequired } from './useFieldStatus';

type RadioFieldOption = Omit<DsfrRadioProps['options'][number], 'nativeInputProps'> & {
  nativeInputProps: Omit<DsfrRadioProps['options'][number]['nativeInputProps'], 'checked' | 'onChange' | 'onBlur' | 'name'>;
};

export type RadioFieldProps = Omit<DsfrRadioProps, 'state' | 'stateRelatedMessage' | 'options'> & {
  options: RadioFieldOption[];
};

/**
 * Radio button group bound to the enclosing TanStack Form field (DSFR rendering).
 * The checked option is the one whose `nativeInputProps.value` equals the field value.
 */
export function RadioField({ options, ...props }: RadioFieldProps) {
  const field = useFieldContext<string>();
  const errorState = useFieldErrorState();
  const isRequired = useFieldIsRequired();

  return (
    <DsfrRadio
      options={options.map((option) => ({
        ...option,
        nativeInputProps: {
          ...option.nativeInputProps,
          checked: field.state.value === option.nativeInputProps.value,
          name: field.name,
          onBlur: field.handleBlur,
          onChange: (event) => field.handleChange(event.target.value),
          required: isRequired,
        },
      }))}
      {...errorState}
      {...props}
    />
  );
}
