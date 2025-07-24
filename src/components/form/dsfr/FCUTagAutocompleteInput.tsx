import FCUTagAutocomplete, { type FCUTagAutocompleteProps } from '@/components/form/FCUTagAutocomplete';

import FieldWrapper, { type FieldWrapperProps } from '../dsfr/FieldWrapper';

export type FCUTagAutocompleteInputProps = Omit<FieldWrapperProps, 'onSelect' | 'children'> & FCUTagAutocompleteProps;

const FCUTagAutocompleteInput = ({
  fieldId,
  label,
  hintText,
  state,
  stateRelatedMessage,
  className,
  ...props
}: FCUTagAutocompleteInputProps) => {
  return (
    <FieldWrapper
      fieldId={fieldId}
      label={label}
      hintText={hintText}
      state={state}
      stateRelatedMessage={stateRelatedMessage}
      className={className}
    >
      <FCUTagAutocomplete
        classNames={{
          input: 'fr-input !px-0 !py-0 !shadow-none',
          wrapper: 'bg-input shadow-[inset_0_-2px_0_0_#3a3a3a] px-4 py-2',
        }}
        {...props}
      />
    </FieldWrapper>
  );
};

export default FCUTagAutocompleteInput;
