import { fr } from '@codegouvfr/react-dsfr';
import { useId } from 'react';

import Autocomplete, { type AddressAutocompleteProps } from '../AddressAutocomplete';
import FieldWrapper, { type FieldWrapperProps } from '../dsfr/FieldWrapper';

export type AddressAutocompleteInputProps = Omit<FieldWrapperProps, 'onSelect' | 'children'> & AddressAutocompleteProps;

const AddressAutocompleteInput = ({
  fieldId,
  label,
  hintText,
  state,
  stateRelatedMessage,
  className,
  nativeInputProps,
  ...props
}: AddressAutocompleteInputProps) => {
  const generatedId = useId();
  const id = fieldId || generatedId;

  return (
    <FieldWrapper
      fieldId={id}
      label={typeof label === 'undefined' ? 'Adresse' : label}
      hintText={hintText}
      state={state}
      stateRelatedMessage={stateRelatedMessage}
      className={className}
    >
      <Autocomplete
        id={id}
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

export default AddressAutocompleteInput;
