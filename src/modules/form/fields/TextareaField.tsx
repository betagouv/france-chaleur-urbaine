import DsfrTextArea, { type InputProps as DsfrTextAreaProps } from '@/components/form/dsfr/TextArea';

import { useFieldContext } from '../form-contexts';
import { useEditableFieldErrorState, useFieldIsRequired } from './useFieldStatus';

export type TextareaFieldProps = Omit<DsfrTextAreaProps, 'state' | 'stateRelatedMessage' | 'nativeTextAreaProps'> & {
  nativeTextAreaProps?: Omit<NonNullable<DsfrTextAreaProps['nativeTextAreaProps']>, 'value' | 'onChange' | 'onBlur' | 'onFocus'>;
};

/**
 * Textarea bound to the enclosing TanStack Form field (DSFR rendering).
 * Value, error display and the required marker are driven by the form state and schema.
 */
export function TextareaField({ nativeTextAreaProps, ...props }: TextareaFieldProps) {
  const field = useFieldContext<string>();
  const { onBlur, onFocus, state, stateRelatedMessage } = useEditableFieldErrorState();
  const isRequired = useFieldIsRequired();

  return (
    <DsfrTextArea
      nativeTextAreaProps={{
        name: field.name,
        onBlur: () => {
          field.handleBlur();
          onBlur();
        },
        onChange: (event) => field.handleChange(event.target.value),
        onFocus,
        required: isRequired,
        value: field.state.value,
        ...nativeTextAreaProps,
      }}
      state={state}
      stateRelatedMessage={stateRelatedMessage}
      {...props}
    />
  );
}
