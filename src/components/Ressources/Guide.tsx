import { Button } from '@codegouvfr/react-dsfr/Button';

import { trackEvent, trackPostHogEvent } from '@/modules/analytics/client';

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
            trackPostHogEvent('content:click', { content_name: 'Guide Copropriétés', content_type: 'guide', source: 'ressources' });
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
