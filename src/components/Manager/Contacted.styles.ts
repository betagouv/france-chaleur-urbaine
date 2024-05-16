import { Checkbox as DSFRCheckbox } from '@codegouvfr/react-dsfr/Checkbox';
import styled from 'styled-components';

export const Checkbox = styled(DSFRCheckbox)`
  & .fr-label:before {
    margin-top: 0 !important;
  }
`;
