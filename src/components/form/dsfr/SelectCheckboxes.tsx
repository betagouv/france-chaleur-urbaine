import styled from 'styled-components';

import { Popover, PopoverContent, PopoverTrigger } from '@components/ui/Popover';

import Checkbox, { type CheckboxProps } from './Checkbox';
import FieldWrapper, { type FieldWrapperProps } from './FieldWrapper';

type SelectCheckboxesProps = Omit<FieldWrapperProps, 'onSelect' | 'children'> & CheckboxProps;

const StyledCheckbox = styled(Checkbox)`
  margin-bottom: 0.5rem;

  .fr-fieldset__content .fr-radio-group:first-child,
  .fr-fieldset__content .fr-checkbox-group:first-child {
    /* HACK for DSFR weird negative margin */
    margin-top: 0;
  }
`;

const SelectCheckboxes = ({ fieldId, label, hintText, state, stateRelatedMessage, className, ...props }: SelectCheckboxesProps) => {
  const nbChechedChecboxes = props.options.filter(({ nativeInputProps }: any) => nativeInputProps.checked).length;
  return (
    <FieldWrapper
      fieldId={fieldId}
      label={label}
      hintText={hintText}
      state={state}
      stateRelatedMessage={stateRelatedMessage}
      className={className}
    >
      <Popover>
        <PopoverTrigger asChild>
          <select className="fr-select" id="select-hint" name="select-hint">
            <option value="" selected disabled hidden>
              {nbChechedChecboxes === 0
                ? 'Sélectionner une option'
                : nbChechedChecboxes === 1
                ? '1 option sélectionnée'
                : `${nbChechedChecboxes} options sélectionnées`}
            </option>
          </select>
        </PopoverTrigger>
        <PopoverContent className="fr-px-2w fr-py-1w">
          <StyledCheckbox {...props} />
        </PopoverContent>
      </Popover>
    </FieldWrapper>
  );
};

export default SelectCheckboxes;
