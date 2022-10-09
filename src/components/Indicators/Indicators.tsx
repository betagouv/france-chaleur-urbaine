import { Alert, Callout, CalloutTitle } from '@dataesr/react-dsfr';
import { useState } from 'react';
import Form from './Form';
import { Container } from './Indicators.styles';

const Indicators = () => {
  const [submitted, setSubmitted] = useState(false);

  return (
    <Container padding={8}>
      <h1>Indicateurs des réseaux classés pour l’année 2021</h1>
      {submitted ? (
        <Alert
          type="success"
          title="Merci pour votre contribution : vos indicateurs sont bien enregistrés. "
          description={
            <>
              Vous souhaitez faire connaître votre réseau de chaleur via France
              Chaleur Urbaine pour accélérer son déploiement ?
              <br />
              Vous pouvez déposer son tracé et le périmètre de développement
              prioritaire{' '}
              <a href="/contribution" target="_blank" rel="noopener noreferrer">
                ici
              </a>
              , afin de les faire afficher sur notre{' '}
              <a href="/carte" target="_blank" rel="noopener noreferrer">
                cartographie.
              </a>{' '}
            </>
          }
        />
      ) : (
        <>
          <p>
            <b>
              Vous êtes sur la plateforme de remontée des indicateurs relatifs
              aux performances économiques des réseaux de chaleur ou de froid
              transmis en application de l’article R712-11 du code de l’énergie.
            </b>
          </p>
          <p>
            Conformément à{' '}
            <a
              href="https://www.legifrance.gouv.fr"
              target="_blank"
              rel="noreferrer noopener"
            >
              l'arrêté [...] en date du [...]
            </a>
            , les indicateurs relatifs au prix moyen, au prix moyen par
            catégorie d’abonné, au poids de la part proportionnelle aux
            consommations et au poids de la part forfaitaire de l’abonnement
            dans la facturation sont à renseigner sur cette plateforme dans le
            mois suivant la publication du rapport annuel.
          </p>
          <p>
            Les indicateurs recueillis dans le cadre de ce service public de
            collecte de données réglementaires seront téléchargeables en ligne
            sur le site de France Chaleur Urbaine et librement réutilisables.{' '}
          </p>
          <Callout hasInfoIcon={false}>
            <CalloutTitle size="sm">
              Page temporaire, en attente de la validation et de la publication
              de l'arrêté
            </CalloutTitle>
          </Callout>
          <Form afterSubmit={() => setSubmitted(true)} />
        </>
      )}
    </Container>
  );
};

export default Indicators;
