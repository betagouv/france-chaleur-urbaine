import DsfrInput, { type InputProps as DsfrInputProps } from '@/components/form/dsfr/Input';

import { useFieldContext } from '../form-contexts';
import { useEditableFieldErrorState, useFieldIsRequired } from './useFieldStatus';

export type TextFieldProps = Omit<DsfrInputProps, 'state' | 'stateRelatedMessage' | 'nativeInputProps'> & {
  nativeInputProps?: Omit<NonNullable<DsfrInputProps['nativeInputProps']>, 'value' | 'onChange' | 'onBlur' | 'onFocus'>;
};

/**
 * Text input bound to the enclosing TanStack Form field (DSFR rendering).
 * Value, error display and the required marker are driven by the form state and schema.
 */
export function TextField({ nativeInputProps, ...props }: TextFieldProps) {
  const field = useFieldContext<string>();
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
        onChange: (event) => field.handleChange(event.target.value),
        onFocus,
        required: isRequired,
        value: field.state.value,
        ...nativeInputProps,
      }}
      state={state}
      stateRelatedMessage={stateRelatedMessage}
      {...props}
    />
  );
}
