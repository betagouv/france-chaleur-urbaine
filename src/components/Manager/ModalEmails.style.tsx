import { Modal } from '@codegouvfr/react-dsfr';
import styled from 'styled-components';

export const StyledModal = styled(Modal)`
  // force la classe fr-col-12 plutôt que fr-col-md-6
  & > .fr-container-md .fr-col-12 {
    flex: 0 0 100% !important;
    max-width: 100% !important;
    width: 100% !important;
  }

  textarea {
    cursor: text;
  }
`;

export const ModalContentWrapper = styled.div`
  margin-top: -2em;
  margin-bottom: -48px; // diminue le padding de la modale
`;

export const HorizontalSeparator = styled.div`
  width: 100%;
  border: 1px solid #e1e1e1;
`;
