import { useEditableFieldErrorState } from '@/modules/form/fields/useFieldStatus';
import { useFieldContext } from '@/modules/form/form-contexts';

import { InputWithSuffix, type InputWithSuffixProps } from './InputWithSuffix';

type SimulationNumberFieldProps = Omit<InputWithSuffixProps, 'value' | 'onChange' | 'onBlur' | 'onFocus' | 'state' | 'stateRelatedMessage'>;

/**
 * Binds the simulator's unit input to TanStack Form with the standard typing/blur validation policy.
 */
export function SimulationNumberField(props: SimulationNumberFieldProps) {
  const field = useFieldContext<number | undefined>();
  const { onBlur, ...errorState } = useEditableFieldErrorState();

  return (
    <InputWithSuffix
      {...props}
      {...errorState}
      value={field.state.value === undefined ? '' : String(field.state.value)}
      onChange={(value) => field.handleChange(value === '' ? undefined : Number(value.replace(',', '.')))}
      onBlur={() => {
        field.handleBlur();
        onBlur();
      }}
    />
  );
}
