import { Modal } from '@dataesr/react-dsfr';
import styled from 'styled-components';

export const StyledModal = styled(Modal)`
  // Surcharge la disposition par défaut qui est prédéfinie et statique
  // afin d'avoir plus de contrôle sur la largeur de la modal
  // cf https://github.com/dataesr/react-dsfr/blob/666f089b2209a9c2d7ef73fe0f79f129923c2b7b/src/components/interface/Modal/Modal.js#L32-L33

  // force la classe fr-col-12 plutôt que fr-col-md-6
  & > .fr-container-md .fr-col-12 {
    flex: 0 0 100% !important;
    max-width: 100% !important;
    width: 100% !important;
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

export const Title = styled.h2``;
