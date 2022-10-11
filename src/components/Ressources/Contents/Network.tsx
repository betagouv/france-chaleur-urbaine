import { Col, Row } from '@dataesr/react-dsfr';
import { List, Source, Subtitle } from './Contents.styles';

const Network = () => {
  return (
    <>
      <Subtitle>
        Tout réseau de chaleur comporte les principaux éléments suivants :
      </Subtitle>
      <Row>
        <Col n="md-12 lg-6" className="fr-pr-1w">
          <List>
            <li>
              L’<b>unité de production de chaleur</b> : il peut s’agir d’une
              usine d’incinération des ordures ménagères (UIOM), d’une centrale
              de géothermie profonde, d’une chaufferie biomasse ou encore d’une
              chaufferie alimentée par un combustible fossile (gaz...).
              Généralement un réseau comporte une unité principale qui
              fonctionne en continu et une unité d’appoint utilisée en renfort
              pendant les heures de pointe, ou en remplacement lorsque cela est
              nécessaire.
            </li>
            <li>
              Le <b>réseau de distribution primaire</b> : il est composé de
              canalisations dans lesquelles la chaleur est transportée par un
              fluide caloporteur (vapeur ou eau chaude). Un circuit aller
              transporte le fluide chaud issu de l’unité de production. Un
              circuit retour ramène le fluide, qui s’est délesté de ses calories
              au niveau de la sous-station d’échange. Le fluide est alors à
              nouveau chauffé par la chaufferie centrale, puis renvoyé dans le
              circuit.
            </li>
          </List>
        </Col>
        <Col n="md-0 lg-6" className="fr-pl-1w fr-hidden fr-unhidden-lg">
          <img
            width="100%"
            src="/img/rcu-illustation.svg"
            alt="Un reseau de chaleur urbain"
          />
        </Col>
      </Row>
      <List withoutMargin>
        <li>
          Les <b>sous-stations d’échange</b> : situées en pied d’immeuble, elles
          permettent le transfert de chaleur par le biais d’un échangeur entre
          le réseau de distribution primaire et le réseau de distribution
          secondaire qui dessert un immeuble ou un petit groupe d’immeubles. Le
          réseau secondaire ne fait pas partie du réseau de chaleur au sens
          juridique, car il n’est pas géré par le responsable du réseau de
          chaleur mais par le responsable de l’immeuble.
        </li>
      </List>
      <Source>
        Source : Cerema{' '}
        <a
          href="https://reseaux-chaleur.cerema.fr/espace-documentaire/constitution-reseau-chaleur"
          target="_blank"
          rel="noreferrer"
        >
          https://reseaux-chaleur.cerema.fr/espace-documentaire/constitution-reseau-chaleur
        </a>
      </Source>
      <img src="/img/ressources-network.png" alt="" className="fr-mt-4w" />
    </>
  );
};

export default Network;
