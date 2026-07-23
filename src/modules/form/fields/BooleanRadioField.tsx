import DsfrRadio, { type RadioProps as DsfrRadioProps } from '@/components/form/dsfr/Radio';

import { useFieldContext } from '../form-contexts';
import { useFieldErrorState, useFieldIsRequired } from './useFieldStatus';

export type BooleanRadioFieldProps = Omit<DsfrRadioProps, 'state' | 'stateRelatedMessage' | 'options'> & {
  noLabel?: string;
  yesLabel?: string;
};

/**
 * Yes/no radio group bound to the enclosing TanStack Form field (boolean value,
 * DSFR rendering) — `RadioField` only binds string values.
 */
export function BooleanRadioField({ noLabel = 'non', yesLabel = 'oui', ...props }: BooleanRadioFieldProps) {
  const field = useFieldContext<boolean | undefined>();
  const errorState = useFieldErrorState();
  const isRequired = useFieldIsRequired();

  return (
    <DsfrRadio
      options={[
        {
          label: yesLabel,
          nativeInputProps: {
            checked: field.state.value === true,
            name: field.name,
            onBlur: field.handleBlur,
            onChange: () => field.handleChange(true),
            required: isRequired,
          },
        },
        {
          label: noLabel,
          nativeInputProps: {
            checked: field.state.value === false,
            name: field.name,
            onBlur: field.handleBlur,
            onChange: () => field.handleChange(false),
            required: isRequired,
          },
        },
      ]}
      {...errorState}
      {...props}
    />
  );
}
