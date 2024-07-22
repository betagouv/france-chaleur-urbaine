import Box from '@components/ui/Box';

import { LeftImage, List, Subtitle } from './Contents.styles';

const Feasability = () => {
  return (
    <>
      <Subtitle>La faisabilité d’un raccordement au réseau de chaleur dépend :</Subtitle>
      <List>
        <li>
          De la distance au réseau
          <br />
          <br />
        </li>
        <li>Du mode de chauffage actuel :</li>
        <Box className="fr-grid-row fr-my-4w">
          <Box className="fr-col-sm-0 fr-col-md-2 fr-hidden fr-unhidden-md">
            <LeftImage src="/img/ressources-feasability-3.svg" alt="" />
          </Box>
          <Box className="fr-col-sm-12 fr-col-md-9 fr-col-offset-1">
            ◦ si le bâtiment est équipé d’un système de chauffage Boxlectif (gaz ou fioul), il possède déjà un réseau de distribution
            interne et les équipements adaptés au sein des logements. C’est la situation la plus favorable pour le raccordement à un réseau
            de chaleur.
            <br />
            <br />
          </Box>
          <Box className="fr-col-sm fr-col-md-2 fr-hidden fr-unhidden-md">
            <LeftImage src="/img/ressources-feasability-2.svg" alt="" />
          </Box>
          <Box className="fr-col-sm-12 fr-col-md-9 fr-col-offset-1">
            ◦ si le bâtiment est équipé de systèmes de chauffage individuels au gaz, il possède déjà les équipements adaptés au sein des
            logements, mais un réseau de distribution interne devra être créé. La création de ce réseau interne nécessitera des travaux
            conséquents et coûteux au sein de l’immeuble.
            <br />
            <br />
          </Box>
          <Box className="fr-col-sm fr-col-md-2 fr-hidden fr-unhidden-md">
            <LeftImage src="/img/ressources-feasability-1.svg" alt="" />
          </Box>
          <Box className="fr-col-sm-12 fr-col-md-9 fr-col-offset-1">
            ◦ si le bâtiment est équipé d’un système de chauffage individuel électrique, un réseau de distribution interne et des
            équipements adaptés au sein des logements devront être créés. Des travaux conséquents et coûteux seront nécessaires au sein de
            l’immeuble et des logements. Cette situation est peu favorable au raccordement à un réseau de chaleur.
            <br />
            <br />
          </Box>
        </Box>
        <li>
          Des <b>caractéristiques techniques propres à chaque réseau</b> (capacité de production par exemple).
        </li>
      </List>
      <br />
      France Chaleur Urbaine vous donne un premier niveau de réponse sur la faisabilité du raccordement sur la base de la distance entre
      votre adresse et le réseau le plus proche, et de votre mode de chauffage actuel. Le gestionnaire du réseau a ensuite la charge
      d’étudier plus précisément votre demande, en intégrant des critères techniques et économiques.
    </>
  );
};

export default Feasability;
