import ChipAutoComplete, { type ChipAutoCompleteProps } from '@/components/ui/ChipAutoComplete';

import FieldWrapper, { type FieldWrapperProps } from '../dsfr/FieldWrapper';

export type ChipAutocompleteInputProps = Omit<FieldWrapperProps, 'onSelect' | 'children'> & ChipAutoCompleteProps;

const ChipAutocompleteInput = ({
  fieldId,
  label,
  hintText,
  state,
  stateRelatedMessage,
  className,
  ...props
}: ChipAutocompleteInputProps) => {
  return (
    <FieldWrapper
      fieldId={fieldId}
      label={label}
      hintText={hintText}
      state={state}
      stateRelatedMessage={stateRelatedMessage}
      className={className}
    >
      <ChipAutoComplete {...props} />
    </FieldWrapper>
  );
};

export default ChipAutocompleteInput;
