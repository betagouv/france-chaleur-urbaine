import { TextInput } from '@dataesr/react-dsfr';
import { _hasError } from '@utils/form-utils';

const Input = ({
  label,
  field,
  form,
  required,
  type,
  id,
  ...otherProps
}: any) => {
  const hasError = _hasError(field.name, form);
  return (
    <TextInput
      label={label}
      required={required}
      type={type}
      {...field}
      {...otherProps}
      message={form.errors[field.name]}
      messageType={hasError ? 'error' : null}
    />
  );
};

export default Input;
