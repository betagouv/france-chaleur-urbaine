import { useId } from 'react';

import DsfrCheckbox, { type CheckboxProps as DsfrCheckboxProps } from '@/components/form/dsfr/Checkbox';

import { useFieldContext } from '../form-contexts';
import { useDiscreteFieldErrors } from './useFieldStatus';

export type CheckboxFieldProps = Omit<DsfrCheckboxProps, 'state' | 'stateRelatedMessage' | 'nativeInputProps'> & {
  nativeInputProps?: Omit<NonNullable<DsfrCheckboxProps['nativeInputProps']>, 'checked' | 'onChange' | 'onBlur' | 'name'> & {
    name?: string;
  };
};

/**
 * Single checkbox bound to the enclosing TanStack Form field (boolean value, DSFR rendering).
 * The error renders below, outside the DSFR component: passing it `stateRelatedMessage`
 * makes react-dsfr switch from a bare checkbox group to a full fieldset structure,
 * shifting the checkbox and its label when the error appears/disappears. The DSFR red
 * side bar is reproduced with an absolutely-positioned element for the same reason.
 */
export function CheckboxField({ nativeInputProps, ...props }: CheckboxFieldProps) {
  const field = useFieldContext<boolean>();
  const errors = useDiscreteFieldErrors();
  const messageId = useId();

  return (
    <div className="relative">
      {errors.length > 0 && <div className="absolute inset-y-0 -left-4 w-0.5 bg-(--border-plain-error)" aria-hidden />}
      <DsfrCheckbox
        small
        nativeInputProps={{
          'aria-describedby': errors.length > 0 ? messageId : undefined,
          checked: field.state.value,
          name: field.name,
          onBlur: field.handleBlur,
          onChange: (event) => field.handleChange(event.target.checked),
          ...nativeInputProps,
        }}
        {...props}
      />
      {errors.length > 0 && (
        <p id={messageId} className="fr-message fr-message--error mt-2">
          {errors.join(', ')}
        </p>
      )}
    </div>
  );
}
