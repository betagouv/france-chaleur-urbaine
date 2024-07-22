import { Cartridge } from '@components/MarkdownWrapper/MarkdownWrapper.style';
import TrackedVideo from '@components/TrackedVideo/TrackedVideo';

import { Container, Title } from './Explanation.styles';
import { Box, CartridgeContent, CartridgeContentValue, CartridgeTitle } from './UseCase.styles';

const UseCase = () => {
  return (
    <Container>
      <Title>
        <h2>Ils sont satisfaits :</h2>
        <p>Découvrez en vidéo comment se passe concrètement un raccordement au chauffage urbain.</p>
        <TrackedVideo width="100%" src="/videos/FCU-accueil.mp4" poster="/videos/FCU-accueil.jpg" />
      </Title>
      <Box theme="blue">
        <h2>Cas concret</h2>
        <h3>Qui ?</h3>
        <p>Copropriété chauffée au gaz collectif de 126 logements répartis en 3 bâtiments.</p>
        <h3>Durée des travaux :</h3>
        <p>4 mois</p>
        <h3>Coût du raccordement :</h3>
        <Cartridge theme="yellow">
          <CartridgeTitle>105 000€ - 76 000€ d’aides</CartridgeTitle>
          (Coup de pouce chauffage des bâtiments résidentiels collectifs et tertiaires)
          <br />
          <br />
          <CartridgeContent>
            Soit <CartridgeContentValue>230€</CartridgeContentValue> par lot environ.
          </CartridgeContent>
        </Cartridge>
        <h3>Coût de la chaleur :</h3>
        <Cartridge theme="yellow">
          <CartridgeContentValue>108€/mois pour un T4</CartridgeContentValue>
        </Cartridge>
        <p>Chauffage et eau chaude</p>
      </Box>
    </Container>
  );
};

export default UseCase;
