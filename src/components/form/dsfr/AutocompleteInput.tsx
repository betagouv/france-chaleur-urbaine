import { fr } from '@codegouvfr/react-dsfr';

import Autocomplete, { type AutocompleteProps } from '../Autocomplete';
import FieldWrapper, { type FieldWrapperProps } from '../dsfr/FieldWrapper';

type DefaultOption = Record<string, any>;

type AutocompleteInputProps<Option extends DefaultOption> = Omit<FieldWrapperProps, 'onSelect' | 'children'> & AutocompleteProps<Option>;

const AutocompleteInput = <Option extends DefaultOption>({
  fieldId,
  label,
  hintText,
  state,
  stateRelatedMessage,
  className,
  nativeInputProps,
  ...props
}: AutocompleteInputProps<Option>) => {
  return (
    <FieldWrapper
      fieldId={fieldId}
      label={label}
      hintText={hintText}
      state={state}
      stateRelatedMessage={stateRelatedMessage}
      className={className}
    >
      <Autocomplete
        nativeInputProps={{
          className: fr.cx('fr-input', {
            'fr-input--error': state === 'error',
            'fr-input--valid': state === 'success',
          }),
          style: {
            // this is because DSFR uses .fr-label + .fr-input, .fr-label + .fr-input-wrap, .fr-label + .fr-select which can't be used here
            marginTop: label ? '0.5rem' : 'inherit',
          },
          ...nativeInputProps,
        }}
        {...props}
      />
    </FieldWrapper>
  );
};

export default AutocompleteInput;
