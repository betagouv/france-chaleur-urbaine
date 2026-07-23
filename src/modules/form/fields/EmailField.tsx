import { TextField, type TextFieldProps } from './TextField';

/**
 * Email input bound to the enclosing TanStack Form field.
 * TextField preset with the proper input type and autocomplete.
 */
export function EmailField({ nativeInputProps, ...props }: TextFieldProps) {
  return <TextField nativeInputProps={{ autoComplete: 'email', type: 'email', ...nativeInputProps }} {...props} />;
}
