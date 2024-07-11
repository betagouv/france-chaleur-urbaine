import { ComboboxPopover as ReachComboboxPopover } from '@reach/combobox';
import styled from 'styled-components';
export {
  Combobox,
  ComboboxInput,
  ComboboxList,
  ComboboxOption,
} from '@reach/combobox';

export const ComboboxPopover = styled(ReachComboboxPopover)`
  & [data-reach-combobox-popover] {
    z-index: 200;
    background-color: var(--background-contrast-grey);
  }

  & [data-reach-combobox-option]:hover {
    background-color: var(--background-contrast-grey-hover);
  }
`;
