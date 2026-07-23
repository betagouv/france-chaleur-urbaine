import DsfrInput, { type InputProps as DsfrInputProps } from '@/components/form/dsfr/Input';

import { useFieldContext } from '../form-contexts';
import { useEditableFieldErrorState, useFieldIsRequired } from './useFieldStatus';

export type NumberFieldProps = Omit<DsfrInputProps, 'state' | 'stateRelatedMessage' | 'nativeInputProps'> & {
  nativeInputProps?: Omit<NonNullable<DsfrInputProps['nativeInputProps']>, 'value' | 'onChange' | 'onBlur' | 'onFocus' | 'type'>;
};

/**
 * Number input bound to the enclosing TanStack Form field (DSFR rendering).
 * Stores a number, or `undefined` when the input is emptied (an empty string
 * would fail `z.number()` schemas).
 */
export function NumberField({ nativeInputProps, ...props }: NumberFieldProps) {
  const field = useFieldContext<number | undefined>();
  const { onBlur, onFocus, state, stateRelatedMessage } = useEditableFieldErrorState();
  const isRequired = useFieldIsRequired();

  return (
    <DsfrInput
      nativeInputProps={{
        name: field.name,
        onBlur: () => {
          field.handleBlur();
          onBlur();
        },
        onChange: (event) => field.handleChange(event.target.value === '' ? undefined : event.target.valueAsNumber),
        onFocus,
        required: isRequired,
        type: 'number',
        value: field.state.value ?? '',
        ...nativeInputProps,
      }}
      state={state}
      stateRelatedMessage={stateRelatedMessage}
      {...props}
    />
  );
}
