import { TextField, type TextFieldProps } from './TextField';

/**
 * Phone number input bound to the enclosing TanStack Form field.
 * TextField preset with the proper input type, autocomplete and placeholder.
 */
export function PhoneField({ nativeInputProps, ...props }: TextFieldProps) {
  return <TextField nativeInputProps={{ autoComplete: 'tel', placeholder: '0123456789', type: 'tel', ...nativeInputProps }} {...props} />;
}
