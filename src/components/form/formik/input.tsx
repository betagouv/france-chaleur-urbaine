import { Input as DSFRInput } from '@codegouvfr/react-dsfr/Input';

import { _hasError } from '@utils/form-utils';

const Input = ({ label, field, form, required, type, id, ...otherProps }: any) => {
  const hasError = _hasError(field.name, form);
  return (
    <DSFRInput
      label={label}
      nativeInputProps={{
        type,
        required,
        id,
        ...field,
        ...otherProps,
      }}
      state={hasError ? 'error' : 'default'}
      stateRelatedMessage={form.errors[field.name]}
    />
  );
};

export default Input;
