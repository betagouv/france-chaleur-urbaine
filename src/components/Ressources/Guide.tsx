import { Button } from '@codegouvfr/react-dsfr/Button';

import { trackEvent } from 'src/services/analytics';

import { Container, Content, GuideImage, TopLeft } from './Guide.styles';

const Guide = () => {
  return (
    <Container>
      <TopLeft src="/img/guide-top-left.svg" alt="" />
      <Content>
        Vous êtes copropriétaire ? <br />
        Téléchargez notre guide de raccordement
        <br />
        <br />
        <Button
          onClick={() => {
            trackEvent('Téléchargement|Guide FCU|Ressources');
            window.open('/documentation/guide-france-chaleur-urbaine.pdf', '_blank');
          }}
        >
          Toutes les infos sur notre guide
        </Button>
      </Content>
      <GuideImage src="/img/ressources-guide.png" alt="Guide France Chaleur Urbaine" />
    </Container>
  );
};

export default Guide;
