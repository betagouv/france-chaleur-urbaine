import Image from 'next/image';

import { StyledInfographieItem } from '@components/Ressources/Contents/Contents.styles';
import SimplePage from '@components/shared/page/SimplePage';
import Box from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import Link from '@components/ui/Link';
import Text from '@components/ui/Text';
import { TrackingEvent } from 'src/services/analytics';

const infographies: InfographieItemProps[] = [
  {
    label: 'Les réseaux de chaleur : une solution d’avenir',
    imgUrl: '/img/support_FCU_Infographie.png',
    linkUrl: '/img/FCU_Infographie_Avenir.jpg',
    eventKey: 'Téléchargement|Supports|Infographie Avenir',
  },
  {
    label: 'Le classement automatique des réseaux de chaleur',
    imgUrl: '/img/support_FCU_Infographie5.png',
    linkUrl: '/img/FCU_Infographie_Classement.jpg',
    eventKey: 'Téléchargement|Supports|Infographie Classement',
  },
  {
    label: 'Les ménages français et le chauffage',
    imgUrl: '/img/support_FCU_Infographie4.png',
    linkUrl: '/img/FCU_Infographie_Menage.jpg',
    eventKey: 'Téléchargement|Supports|Infographie Ménages',
  },
  {
    label: 'Combien coûte la chaleur ?',
    imgUrl: '/img/support_FCU_Infographie3.png',
    linkUrl: '/img/FCU_Infographie_Cout.jpg',
    eventKey: 'Téléchargement|Supports|Infographie Cout',
  },
  {
    label: 'Les énergies renouvelables et de récupération',
    imgUrl: '/img/support_FCU_Infographie2.png',
    linkUrl: '/img/FCU_Infographie_Enrr.jpg',
    eventKey: 'Téléchargement|Supports|Infographie ENRR',
  },
  {
    label: 'La géothermie',
    imgUrl: '/img/support_geothermie.png',
    linkUrl: '/img/FCU_Infographie_Geo.jpg',
    eventKey: 'Téléchargement|Supports|Infographie Géothermie',
  },
  {
    label: 'La biomasse',
    imgUrl: '/img/support_biomasse.png',
    linkUrl: '/img/FCU_Infographie_Biomasse.jpg',
    eventKey: 'Téléchargement|Supports|Infographie Biomasse',
  },
  {
    label: 'La chaleur fatale',
    imgUrl: '/img/FCU_Infographie_fatale.jpg',
    linkUrl: '/img/FCU_Infographie_fatale.jpg',
    eventKey: 'Téléchargement|Supports|Infographie Chaleur Fatale',
  },
  {
    label: 'Solaire thermique',
    imgUrl: '/contents/FCU_Infographie-Solaire.jpg',
    linkUrl: '/contents/FCU_Infographie-Solaire.jpg',
    eventKey: 'Téléchargement|Supports|Infographie Solaire',
  },
  {
    label: 'Les réseaux de froid',
    imgUrl: '/img/FCU_Infographie_Froid.jpg',
    linkUrl: '/img/FCU_Infographie_Froid.jpg',
    eventKey: 'Téléchargement|Supports|Infographie Froid',
  },
  {
    label: 'Optimiser son réseau de chaleur',
    imgUrl: '/img/FCU_optimisation_reseaux-chaleur.jpg',
    linkUrl: '/img/FCU_optimisation_reseaux-chaleur.jpg',
    eventKey: 'Téléchargement|Supports|Infographie Optimisation',
  },
  {
    label: 'Les idées reçues n°1',
    imgUrl: '/img/FCU_Infographie_idees_recues_1.preview.webp',
    linkUrl: '/img/FCU_Infographie_idees_recues_1.webp',
    eventKey: 'Téléchargement|Supports|Idées reçues 1',
  },
  {
    label: 'Les idées reçues n°2',
    imgUrl: '/img/FCU_Infographie_idees_recues_2.preview.webp',
    linkUrl: '/img/FCU_Infographie_idees_recues_2.webp',
    eventKey: 'Téléchargement|Supports|Idées reçues 2',
  },
  {
    label: 'Les idées reçues n°3',
    imgUrl: '/img/FCU_Infographie_idees_recues_3.preview.webp',
    linkUrl: '/img/FCU_Infographie_idees_recues_3.webp',
    eventKey: 'Téléchargement|Supports|Idées reçues 3',
  },
  {
    label: 'Les idées reçues n°4',
    imgUrl: '/img/FCU_Infographie_idees_recues_4.preview.webp',
    linkUrl: '/img/FCU_Infographie_idees_recues_4.webp',
    eventKey: 'Téléchargement|Supports|Idées reçues 4',
  },
  {
    label: 'Les idées reçues n°5',
    imgUrl: '/img/FCU_Infographie_idees_recues_5.preview.webp',
    linkUrl: '/img/FCU_Infographie_idees_recues_5.webp',
    eventKey: 'Téléchargement|Supports|Idées reçues 5',
  },
  {
    label: 'Les réseaux de chaleur en région : la Normandie',
    imgUrl: '/img/FCU_Infographie_Normandie.preview.webp',
    linkUrl: '/img/FCU_Infographie_Normandie.webp',
    eventKey: 'Téléchargement|Supports|Normandie',
  },
  {
    label: 'Les réseaux de chaleur en région : les Hauts-de-France',
    imgUrl: '/img/FCU_Infographie_Hauts_de_France.preview.webp',
    linkUrl: '/img/FCU_Infographie_Hauts_de_France.webp',
    eventKey: 'Téléchargement|Supports|Hauts-de-France',
  },
  {
    label: 'Les réseaux de chaleur en région : le Grand Est',
    imgUrl: '/img/FCU_Infographie_Grand_Est.preview.webp',
    linkUrl: '/img/FCU_Infographie_Grand_Est.webp',
    eventKey: 'Téléchargement|Supports|Grand Est',
  },
  {
    label: 'Les réseaux de chaleur en région : la Bougogne-Franche-Comté',
    imgUrl: '/img/FCU_Infographie_Bourgogne_Franche_Comte.preview.webp',
    linkUrl: '/img/FCU_Infographie_Bourgogne_Franche_Comte.webp',
    eventKey: 'Téléchargement|Supports|Bougogne-Franche-Comté',
  },
  {
    label: "Les réseaux de chaleur en région : l'Auvergne-Rhône-Alpes",
    imgUrl: '/img/FCU_Infographie_Auvergne_Rhone_Alpes.preview.webp',
    linkUrl: '/img/FCU_Infographie_Auvergne_Rhone_Alpes.webp',
    eventKey: 'Téléchargement|Supports|Auvergne-Rhône-Alpes',
  },
  {
    label: "Les réseaux de chaleur en région : la Provence-Alpes-Côte-d'Azur",
    imgUrl: '/img/FCU_Infographie_Provence_Alpes_Cote_Azur.preview.webp',
    linkUrl: '/img/FCU_Infographie_Provence_Alpes_Cote_Azur.webp',
    eventKey: "Téléchargement|Supports|Provence-Alpes-Côte-d'Azur",
  },
  {
    label: "Les réseaux de chaleur en région : l'Occitanie",
    imgUrl: '/img/FCU_Infographie_Occitanie.preview.webp',
    linkUrl: '/img/FCU_Infographie_Occitanie.webp',
    eventKey: 'Téléchargement|Supports|Occitanie',
  },
  {
    label: 'Les réseaux de chaleur en région : la Nouvelle-Aquitaine',
    imgUrl: '/img/FCU_Infographie_Nouvelle_Aquitaine.preview.webp',
    linkUrl: '/img/FCU_Infographie_Nouvelle_Aquitaine.webp',
    eventKey: 'Téléchargement|Supports|Nouvelle-Aquitaine',
  },
  {
    label: 'Les réseaux de chaleur en région : les Pays de la Loire',
    imgUrl: '/img/FCU_Infographie_Pays_de_la_Loire.preview.webp',
    linkUrl: '/img/FCU_Infographie_Pays_de_la_Loire.webp',
    eventKey: 'Téléchargement|Supports|Pays de la Loire',
  },
  {
    label: 'Les réseaux de chaleur en région : la Bretagne',
    imgUrl: '/img/FCU_Infographie_Bretagne.preview.webp',
    linkUrl: '/img/FCU_Infographie_Bretagne.webp',
    eventKey: 'Téléchargement|Supports|Bretagne',
  },
  {
    label: 'Les réseaux de chaleur en région : le Centre-Val de Loire',
    imgUrl: '/img/FCU_Infographie_Centre_Val_Loire.preview.webp',
    linkUrl: '/img/FCU_Infographie_Centre_Val_Loire.webp',
    eventKey: 'Téléchargement|Supports|Centre-Val de Loire',
  },
];

const reportages: InfographieItemProps[] = [
  {
    label: 'Forage géothermique de Champigny-sur-Marne',
    imgUrl: '/img/geothermie_champigny.jpeg',
    linkUrl: '/documentation/geothermie_champigny.pdf',
    eventKey: 'Téléchargement|Supports|Reportage géothermie Champigny',
  },
  {
    label: 'Chaufferie biomasse de Surville',
    imgUrl: '/img/chaufferie_surville.jpeg',
    linkUrl: '/documentation/chaufferie_surville.pdf',
    eventKey: 'Téléchargement|Supports|Reportage chaufferie Surville',
  },
  {
    label: 'Datacenter Equinix à Saint-Denis',
    imgUrl: '/img/datacenter_equinix.jpeg',
    linkUrl: '/documentation/datacenter_equinix.pdf',
    eventKey: 'Téléchargement|Supports|Reportage datacenter Equinix',
  },
  {
    label: 'Réseau de froid d’Annecy',
    imgUrl: '/img/reseau_froid_annecy.jpeg',
    linkUrl: '/documentation/reseau_froid_annecy.pdf',
    eventKey: 'Téléchargement|Supports|Reportage réseau froid Annecy',
  },
  {
    label: "Unité de valorisation énergétique d'Issy-les-Moulineaux",
    imgUrl: '/img/FCU_Isseane.jpg',
    linkUrl: '/documentation/FCU_Isseane.pdf',
    eventKey: 'Téléchargement|Supports|Reportage Isseane',
  },
  {
    label: 'Centrale Alsace et chaufferie Charras à Courbevoie',
    imgUrl: '/img/FCU_Alsace_Charras.jpg',
    linkUrl: '/documentation/FCU_Alsace_Charras.pdf',
    eventKey: 'Téléchargement|Supports|Reportage Alsace Charras',
  },
];

const videos: InfographieItemProps[] = [
  {
    label: 'Les réseaux de chaleur : une solution d’avenir',
    imgUrl:
      'https://i.ytimg.com/vi/sZR-vaKBhBM/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLBwdqz2ywUKna-tNwQNlmRmlu8ebA',
    linkUrl: 'https://www.youtube.com/watch?v=sZR-vaKBhBM',
    eventKey: 'Vidéo',
  },
  {
    label: 'Les avantages des réseaux de chaleur',
    imgUrl:
      'https://i.ytimg.com/vi/r1jTVZ3-VnU/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLDR4RPMiAEwmTgt1I425XnQH6cqxA',
    linkUrl: 'https://www.youtube.com/watch?v=r1jTVZ3-VnU',
    eventKey: 'Vidéo',
  },
  {
    label: '"Les ambassadeurs du chauffage urbain" 1',
    imgUrl:
      'https://i.ytimg.com/vi/iv0gb71XOj4/hqdefault.jpg?sqp=-oaymwE2CNACELwBSFXyq4qpAygIARUAAIhCGAFwAcABBvABAfgB_gmAAtAFigIMCAAQARglIGAocjAP&rs=AOn4CLDKnhLEfQ5nuC4gAtHEyQEsUjr7aA',
    linkUrl: 'https://www.youtube.com/watch?v=iv0gb71XOj4',
    eventKey: 'Vidéo',
  },
  {
    label: '"Les ambassadeurs du chauffage urbain" 2',
    imgUrl:
      'https://i.ytimg.com/vi/wtNmhwa5_DA/hqdefault.jpg?sqp=-oaymwE2CNACELwBSFXyq4qpAygIARUAAIhCGAFwAcABBvABAfgB_gmAAtAFigIMCAAQARgpIGUoYTAP&rs=AOn4CLAmpPmyzn4-PqH-Rwlh90Vcr0E6Lw',
    linkUrl: 'https://www.youtube.com/watch?v=wtNmhwa5_DA',
    eventKey: 'Vidéo',
  },
  {
    label: '"Les ambassadeurs du chauffage urbain" 3',
    imgUrl:
      'https://i.ytimg.com/vi/2mO97aF1T4c/hqdefault.jpg?sqp=-oaymwE2CNACELwBSFXyq4qpAygIARUAAIhCGAFwAcABBvABAfgB_gmAAtAFigIMCAAQARggIFkocjAP&rs=AOn4CLDFZlsDFEbwti9vsFLdvElSvrRQjw',
    linkUrl: 'https://www.youtube.com/watch?v=2mO97aF1T4c',
    eventKey: 'Vidéo',
  },
  {
    label: '"Les ambassadeurs du chauffage urbain" 4',
    imgUrl:
      'https://i.ytimg.com/vi/wieL5MpMtnE/hqdefault.jpg?sqp=-oaymwE2CNACELwBSFXyq4qpAygIARUAAIhCGAFwAcABBvABAfgB_gmAAtAFigIMCAAQARgqIGUoYTAP&rs=AOn4CLAMR8N6VE6PxlIeOMAO_wEU9d0JMA',
    linkUrl: 'https://www.youtube.com/watch?v=wieL5MpMtnE',
    eventKey: 'Vidéo',
  },
  {
    label: '"Les ambassadeurs du chauffage urbain" 5',
    imgUrl:
      'https://i.ytimg.com/vi/eDnhC9l5pWI/hqdefault.jpg?sqp=-oaymwE2CNACELwBSFXyq4qpAygIARUAAIhCGAFwAcABBvABAfgB_gmAAtAFigIMCAAQARgjIF0ocjAP&rs=AOn4CLD799UTnieTrHU91zGPBKL-CUZRLw',
    linkUrl: 'https://www.youtube.com/watch?v=eDnhC9l5pWI',
    eventKey: 'Vidéo',
  },
  {
    label: 'Ochôde explique la géothermie',
    imgUrl:
      'https://i.ytimg.com/vi/ebUNfVsXBIQ/hqdefault.jpg?sqp=-oaymwE2CNACELwBSFXyq4qpAygIARUAAIhCGAFwAcABBvABAfgB_gmAAtAFigIMCAAQARgaIGUoWjAP&rs=AOn4CLC52Akpiu6WOi8r1kNZf8OQyyg3lQ',
    linkUrl: 'https://www.youtube.com/watch?v=ebUNfVsXBIQ',
    eventKey: 'Vidéo',
  },
];

const guides: InfographieItemProps[] = [
  {
    label: 'Guide Copropriétés',
    imgUrl: '/img/supports_guide_coproprietes.webp',
    linkUrl: '/documentation/guide-france-chaleur-urbaine.pdf',
    eventKey: 'Téléchargement|Guide FCU|coproprietaire',
  },
  {
    label: 'Guide Exploitants',
    imgUrl: '/img/supports_guide_exploitants.webp',
    linkUrl: '/documentation/FCU_guide_exploitants.pdf',
    eventKey: 'Téléchargement|Guide Exploitants|Collectivités et exploitants',
  },
  {
    label: 'Guide Collectivités',
    imgUrl: '/img/supports_guide_collectivites.webp',
    linkUrl: '/documentation/FCU_guide_collectivites.pdf',
    eventKey: 'Téléchargement|Guide Collectivités|Collectivités et exploitants',
  },
];

const SupportsPage = () => {
  return (
    <SimplePage title="Nos supports - France Chaleur Urbaine">
      <Box backgroundColor="blue-cumulus-950-100">
        <Box display="flex" gap="16px" maxWidth="1000px" mx="auto" pt="8w" px="2w">
          <Box flex>
            <Heading size="h1" color="blue-france">
              Nos supports pédagogiques
            </Heading>
            <Text size="lg" mb="3w">
              Retrouvez tous nos supports de communication pour comprendre simplement et rapidement les enjeux liés aux réseaux de chaleur
              ou mieux connaître notre service.
            </Text>
          </Box>

          <Box className="fr-hidden fr-unhidden-lg">
            <Image src="/img/ressources_header.webp" alt="" width={152} height={180} priority />
          </Box>
        </Box>
      </Box>

      <Box py="10w" className="fr-container" id="infographies">
        <Heading size="h2" color="blue-france" center mb="8w">
          Infographies
        </Heading>
        <Box display="flex" alignItems="baseline" gap="16px" flexWrap="wrap">
          {infographies.map((item, index) => (
            <InfographieItem {...item} key={index} />
          ))}
        </Box>
      </Box>

      <Box backgroundColor="blue-france-975-75" id="reportages">
        <Box py="10w" className="fr-container">
          <Heading size="h2" color="blue-france" center mb="8w">
            Reportages
          </Heading>
          <Box display="flex" alignItems="baseline" gap="16px" flexWrap="wrap">
            {reportages.map((item, index) => (
              <InfographieItem {...item} key={index} />
            ))}
          </Box>
        </Box>
      </Box>

      <Box py="10w" className="fr-container" id="videos">
        <Heading size="h2" color="blue-france" center mb="8w">
          Vidéos
        </Heading>
        <Box display="flex" alignItems="baseline" gap="16px" flexWrap="wrap">
          {videos.map((item, index) => (
            <InfographieItem width={230} {...item} key={index} />
          ))}
        </Box>
      </Box>

      <Box backgroundColor="blue-france-975-75" id="guides">
        <Box py="10w" className="fr-container">
          <Heading size="h2" color="blue-france" center mb="8w">
            Guides
          </Heading>
          <Box display="flex" alignItems="baseline" gap="16px" flexWrap="wrap">
            {guides.map((item, index) => (
              <InfographieItem {...item} key={index} />
            ))}
          </Box>
        </Box>
      </Box>
    </SimplePage>
  );
};

export default SupportsPage;

interface InfographieItemProps {
  label: string;
  imgUrl: string;
  linkUrl: string;
  eventKey?: TrackingEvent;
  width?: number;
}

const InfographieItem = ({ width = 150, ...props }: InfographieItemProps) => (
  <StyledInfographieItem className="fr-card fr-card--no-border fr-card--no-background fr-enlarge-link" width={width}>
    <Link href={props.linkUrl} isExternal eventKey={props.eventKey}>
      <img src={props.imgUrl} alt="" loading="lazy" width={width} />
      <Text size="sm" p="1v">
        {props.label}
      </Text>
    </Link>
  </StyledInfographieItem>
);
