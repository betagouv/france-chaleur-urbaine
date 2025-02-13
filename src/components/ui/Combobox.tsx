import { ComboboxPopover as ReachComboboxPopover } from '@reach/combobox';
import styled from 'styled-components';
export { Combobox, ComboboxInput, ComboboxList, ComboboxOption, ComboboxOptionText } from '@reach/combobox';

export const ComboboxPopover = styled(ReachComboboxPopover)`
  &[data-reach-combobox-popover] {
    z-index: 1751; /* To be above DSFR modal*/
    background-color: var(--background-default-grey);
  }

  [data-reach-combobox-option] {
    background-color: var(--background-default-grey);
  }
  [data-reach-combobox-option]:hover {
    background-color: var(--background-contrast-grey-hover);
  }
  [data-reach-combobox-option][aria-selected='true'] {
    background-color: var(--background-active-blue-france);
    color: white;
  }
`;
