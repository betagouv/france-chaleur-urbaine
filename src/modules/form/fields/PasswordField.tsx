import DsfrPasswordInput, { type InputProps as DsfrPasswordInputProps } from '@/components/form/dsfr/PasswordInput';

import { useFieldContext } from '../form-contexts';
import { useDisplayedFieldErrors, useFieldIsRequired } from './useFieldStatus';

export type PasswordFieldProps = Omit<DsfrPasswordInputProps, 'messages' | 'nativeInputProps'> & {
  nativeInputProps?: Omit<NonNullable<DsfrPasswordInputProps['nativeInputProps']>, 'value' | 'onChange' | 'onBlur' | 'onFocus'>;
};

/**
 * Password input bound to the enclosing TanStack Form field (DSFR block with
 * show/hide toggle). Errors render through the block's `messages` list; the DSFR
 * "Votre mot de passe doit contenir :" hint is disabled by default — pass
 * `messagesHint` to restore it on creation forms listing the password rules.
 * Defaults to `autoComplete="current-password"` — override for creation forms.
 */
export function PasswordField({ messagesHint = '', nativeInputProps, ...props }: PasswordFieldProps) {
  const field = useFieldContext<string>();
  const { errors, onBlur, onFocus } = useDisplayedFieldErrors();
  const isRequired = useFieldIsRequired();

  const messages: DsfrPasswordInputProps['messages'] = errors.map((message) => ({ message, severity: 'error' }));

  return (
    <DsfrPasswordInput
      messages={messages}
      messagesHint={messagesHint}
      nativeInputProps={{
        autoComplete: 'current-password',
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
      {...props}
    />
  );
}
