import React from 'react';
import { Container, ImageContainer } from './WrappedText.style';

function WrappedText() {
  return (
    <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--center fr-grid-row--middle fr-my-4w">
      <Container className="fr-col-lg-6 fr-col-md-12">
        <h2>Une solution d’avenir gagnante pour votre chauffage.</h2>
        <p className="fr-text--lg">
          Un réseau de chaleur permet de{' '}
          <strong>
            relier les bâtiments d’un quartier par des canalisations qui
            distribuent de la chaleur
          </strong>{' '}
          produite avec{' '}
          <strong>
            des sources d’énergies renouvelables, locales et durables
          </strong>
          . <br />
          De quoi remplacer vertueusement le fioul et le gaz !
        </p>
      </Container>

      <ImageContainer className="fr-col-lg-6 fr-col-md-12">
        <img src="./img-solution-avenir.jpg" alt="Reseau de chaleur urbaine" />
      </ImageContainer>
    </div>
  );
}

export default WrappedText;
