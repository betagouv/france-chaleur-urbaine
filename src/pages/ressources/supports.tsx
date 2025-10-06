import { StyledInfographieItem } from '@/components/Ressources/Contents/Contents.styles';
import SimplePage from '@/components/shared/page/SimplePage';
import Hero, { HeroSubtitle, HeroTitle } from '@/components/ui/Hero';
import Link from '@/components/ui/Link';
import Section, { SectionContent, SectionTitle } from '@/components/ui/Section';
import Text from '@/components/ui/Text';
import type { TrackingEvent } from '@/modules/analytics/client';

const infographies: InfographieItemProps[] = [
  {
    eventKey: 'Téléchargement|Supports|Infographie Avenir',
    imgUrl: '/img/support_FCU_Infographie.png',
    label: 'Les réseaux de chaleur : une solution d’avenir',
    linkUrl: '/img/FCU_Infographie_Avenir.jpg',
  },
  {
    eventKey: 'Téléchargement|Supports|Infographie Classement',
    imgUrl: '/img/support_FCU_Infographie5.png',
    label: 'Le classement automatique des réseaux de chaleur',
    linkUrl: '/img/FCU_Infographie_Classement.jpg',
  },
  {
    eventKey: 'Téléchargement|Supports|Infographie Ménages',
    imgUrl: '/img/support_FCU_Infographie4.png',
    label: 'Les ménages français et le chauffage',
    linkUrl: '/img/FCU_Infographie_Menage.jpg',
  },
  {
    eventKey: 'Téléchargement|Supports|Infographie Cout',
    imgUrl: '/img/support_FCU_Infographie3.png',
    label: 'Combien coûte la chaleur ?',
    linkUrl: '/img/FCU_Infographie_Cout.jpg',
  },
  {
    eventKey: 'Téléchargement|Supports|Infographie ENRR',
    imgUrl: '/img/support_FCU_Infographie2.png',
    label: 'Les énergies renouvelables et de récupération',
    linkUrl: '/img/FCU_Infographie_Enrr.jpg',
  },
  {
    eventKey: 'Téléchargement|Supports|Infographie Géothermie',
    imgUrl: '/img/support_geothermie.png',
    label: 'La géothermie',
    linkUrl: '/img/FCU_Infographie_Geo.jpg',
  },
  {
    eventKey: 'Téléchargement|Supports|Infographie Biomasse',
    imgUrl: '/img/support_biomasse.png',
    label: 'La biomasse',
    linkUrl: '/img/FCU_Infographie_Biomasse.jpg',
  },
  {
    eventKey: 'Téléchargement|Supports|Infographie Chaleur Fatale',
    imgUrl: '/img/FCU_Infographie_fatale.jpg',
    label: 'La chaleur fatale',
    linkUrl: '/img/FCU_Infographie_fatale.jpg',
  },
  {
    eventKey: 'Téléchargement|Supports|Infographie Solaire',
    imgUrl: '/contents/FCU_Infographie-Solaire.jpg',
    label: 'Solaire thermique',
    linkUrl: '/contents/FCU_Infographie-Solaire.jpg',
  },
  {
    eventKey: 'Téléchargement|Supports|Infographie Froid',
    imgUrl: '/img/FCU_Infographie_Froid.jpg',
    label: 'Les réseaux de froid',
    linkUrl: '/img/FCU_Infographie_Froid.jpg',
  },
  {
    eventKey: 'Téléchargement|Supports|Infographie Optimisation',
    imgUrl: '/img/FCU_optimisation_reseaux-chaleur.jpg',
    label: 'Optimiser son réseau de chaleur',
    linkUrl: '/img/FCU_optimisation_reseaux-chaleur.jpg',
  },
  {
    eventKey: 'Téléchargement|Supports|Idées reçues 1',
    imgUrl: '/img/FCU_Infographie_idees_recues_1.preview.webp',
    label: 'Les idées reçues n°1',
    linkUrl: '/img/FCU_Infographie_idees_recues_1.webp',
  },
  {
    eventKey: 'Téléchargement|Supports|Idées reçues 2',
    imgUrl: '/img/FCU_Infographie_idees_recues_2.preview.webp',
    label: 'Les idées reçues n°2',
    linkUrl: '/img/FCU_Infographie_idees_recues_2.webp',
  },
  {
    eventKey: 'Téléchargement|Supports|Idées reçues 3',
    imgUrl: '/img/FCU_Infographie_idees_recues_3.preview.webp',
    label: 'Les idées reçues n°3',
    linkUrl: '/img/FCU_Infographie_idees_recues_3.webp',
  },
  {
    eventKey: 'Téléchargement|Supports|Idées reçues 4',
    imgUrl: '/img/FCU_Infographie_idees_recues_4.preview.webp',
    label: 'Les idées reçues n°4',
    linkUrl: '/img/FCU_Infographie_idees_recues_4.webp',
  },
  {
    eventKey: 'Téléchargement|Supports|Idées reçues 5',
    imgUrl: '/img/FCU_Infographie_idees_recues_5.preview.webp',
    label: 'Les idées reçues n°5',
    linkUrl: '/img/FCU_Infographie_idees_recues_5.webp',
  },
  {
    eventKey: 'Téléchargement|Supports|Normandie',
    imgUrl: '/img/FCU_Infographie_Normandie.preview.webp',
    label: 'Les réseaux de chaleur en région : la Normandie',
    linkUrl: '/img/FCU_Infographie_Normandie.webp',
  },
  {
    eventKey: 'Téléchargement|Supports|Hauts-de-France',
    imgUrl: '/img/FCU_Infographie_Hauts_de_France.preview.webp',
    label: 'Les réseaux de chaleur en région : les Hauts-de-France',
    linkUrl: '/img/FCU_Infographie_Hauts_de_France.webp',
  },
  {
    eventKey: 'Téléchargement|Supports|Grand Est',
    imgUrl: '/img/FCU_Infographie_Grand_Est.preview.webp',
    label: 'Les réseaux de chaleur en région : le Grand Est',
    linkUrl: '/img/FCU_Infographie_Grand_Est.webp',
  },
  {
    eventKey: 'Téléchargement|Supports|Bougogne-Franche-Comté',
    imgUrl: '/img/FCU_Infographie_Bourgogne_Franche_Comte.preview.webp',
    label: 'Les réseaux de chaleur en région : la Bougogne-Franche-Comté',
    linkUrl: '/img/FCU_Infographie_Bourgogne_Franche_Comte.webp',
  },
  {
    eventKey: 'Téléchargement|Supports|Auvergne-Rhône-Alpes',
    imgUrl: '/img/FCU_Infographie_Auvergne_Rhone_Alpes.preview.webp',
    label: "Les réseaux de chaleur en région : l'Auvergne-Rhône-Alpes",
    linkUrl: '/img/FCU_Infographie_Auvergne_Rhone_Alpes.webp',
  },
  {
    eventKey: "Téléchargement|Supports|Provence-Alpes-Côte-d'Azur",
    imgUrl: '/img/FCU_Infographie_Provence_Alpes_Cote_Azur.preview.webp',
    label: "Les réseaux de chaleur en région : la Provence-Alpes-Côte-d'Azur",
    linkUrl: '/img/FCU_Infographie_Provence_Alpes_Cote_Azur.webp',
  },
  {
    eventKey: 'Téléchargement|Supports|Occitanie',
    imgUrl: '/img/FCU_Infographie_Occitanie.preview.webp',
    label: "Les réseaux de chaleur en région : l'Occitanie",
    linkUrl: '/img/FCU_Infographie_Occitanie.webp',
  },
  {
    eventKey: 'Téléchargement|Supports|Nouvelle-Aquitaine',
    imgUrl: '/img/FCU_Infographie_Nouvelle_Aquitaine.preview.webp',
    label: 'Les réseaux de chaleur en région : la Nouvelle-Aquitaine',
    linkUrl: '/img/FCU_Infographie_Nouvelle_Aquitaine.webp',
  },
  {
    eventKey: 'Téléchargement|Supports|Pays de la Loire',
    imgUrl: '/img/FCU_Infographie_Pays_de_la_Loire.preview.webp',
    label: 'Les réseaux de chaleur en région : les Pays de la Loire',
    linkUrl: '/img/FCU_Infographie_Pays_de_la_Loire.webp',
  },
  {
    eventKey: 'Téléchargement|Supports|Bretagne',
    imgUrl: '/img/FCU_Infographie_Bretagne.preview.webp',
    label: 'Les réseaux de chaleur en région : la Bretagne',
    linkUrl: '/img/FCU_Infographie_Bretagne.webp',
  },
  {
    eventKey: 'Téléchargement|Supports|Centre-Val de Loire',
    imgUrl: '/img/FCU_Infographie_Centre_Val_Loire.preview.webp',
    label: 'Les réseaux de chaleur en région : le Centre-Val de Loire',
    linkUrl: '/img/FCU_Infographie_Centre_Val_Loire.webp',
  },
  {
    eventKey: 'Téléchargement|Supports|Île-de-France',
    imgUrl: '/img/FCU_Infographie_Ile_de_France.preview.webp',
    label: "Les réseaux de chaleur en région : l'Île-de-France",
    linkUrl: '/img/FCU_Infographie_Ile_de_France.webp',
  },
  {
    eventKey: 'Téléchargement|Supports|Chiffres-clés des réseaux de chaleur 2023',
    imgUrl: '/img/FCU_chiffres-cles_reseaux-chaleur.preview.webp',
    label: 'Chiffres-clés des réseaux de chaleur 2023',
    linkUrl: '/img/FCU_chiffres-cles_reseaux-chaleur.webp',
  },
  {
    eventKey: 'Téléchargement|Supports|Chiffres-clés des réseaux de froid 2023',
    imgUrl: '/img/FCU_chiffres-cles_reseaux-froid.preview.webp',
    label: 'Chiffres-clés des réseaux de froid 2023',
    linkUrl: '/img/FCU_chiffres-cles_reseaux-froid.webp',
  },
  {
    eventKey: 'Téléchargement|Supports|Décarboner le chauffage',
    imgUrl: '/img/FCU_modes-chauffage-decarbones.preview.webp',
    label: 'Décarboner le chauffage',
    linkUrl: '/img/FCU_modes-chauffage-decarbones.webp',
  },
];

const reportages: InfographieItemProps[] = [
  {
    eventKey: 'Téléchargement|Supports|Reportage géothermie Champigny',
    imgUrl: '/img/geothermie_champigny.jpeg',
    label: 'Forage géothermique de Champigny-sur-Marne',
    linkUrl: '/documentation/geothermie_champigny.pdf',
  },
  {
    eventKey: 'Téléchargement|Supports|Reportage chaufferie Surville',
    imgUrl: '/img/chaufferie_surville.jpeg',
    label: 'Chaufferie biomasse de Surville',
    linkUrl: '/documentation/chaufferie_surville.pdf',
  },
  {
    eventKey: 'Téléchargement|Supports|Reportage datacenter Equinix',
    imgUrl: '/img/datacenter_equinix.jpeg',
    label: 'Datacenter Equinix à Saint-Denis',
    linkUrl: '/documentation/datacenter_equinix.pdf',
  },
  {
    eventKey: 'Téléchargement|Supports|Reportage réseau froid Annecy',
    imgUrl: '/img/reseau_froid_annecy.jpeg',
    label: 'Réseau de froid d’Annecy',
    linkUrl: '/documentation/reseau_froid_annecy.pdf',
  },
  {
    eventKey: 'Téléchargement|Supports|Reportage Isseane',
    imgUrl: '/img/FCU_Isseane.jpg',
    label: "Unité de valorisation énergétique d'Issy-les-Moulineaux",
    linkUrl: '/documentation/FCU_Isseane.pdf',
  },
  {
    eventKey: 'Téléchargement|Supports|Reportage Alsace Charras',
    imgUrl: '/img/FCU_Alsace_Charras.jpg',
    label: 'Centrale Alsace et chaufferie Charras à Courbevoie',
    linkUrl: '/documentation/FCU_Alsace_Charras.pdf',
  },
];

const videos: InfographieItemProps[] = [
  {
    eventKey: 'Vidéo',
    imgUrl:
      'https://i.ytimg.com/vi/sZR-vaKBhBM/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLBwdqz2ywUKna-tNwQNlmRmlu8ebA',
    label: 'Les réseaux de chaleur : une solution d’avenir',
    linkUrl: 'https://www.youtube.com/watch?v=sZR-vaKBhBM',
  },
  {
    eventKey: 'Vidéo',
    imgUrl:
      'https://i.ytimg.com/vi/r1jTVZ3-VnU/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLDR4RPMiAEwmTgt1I425XnQH6cqxA',
    label: 'Les avantages des réseaux de chaleur',
    linkUrl: 'https://www.youtube.com/watch?v=r1jTVZ3-VnU',
  },
  {
    eventKey: 'Vidéo',
    imgUrl:
      'https://i.ytimg.com/vi/iv0gb71XOj4/hqdefault.jpg?sqp=-oaymwE2CNACELwBSFXyq4qpAygIARUAAIhCGAFwAcABBvABAfgB_gmAAtAFigIMCAAQARglIGAocjAP&rs=AOn4CLDKnhLEfQ5nuC4gAtHEyQEsUjr7aA',
    label: '"Les ambassadeurs du chauffage urbain" 1',
    linkUrl: 'https://www.youtube.com/watch?v=iv0gb71XOj4',
  },
  {
    eventKey: 'Vidéo',
    imgUrl:
      'https://i.ytimg.com/vi/wtNmhwa5_DA/hqdefault.jpg?sqp=-oaymwE2CNACELwBSFXyq4qpAygIARUAAIhCGAFwAcABBvABAfgB_gmAAtAFigIMCAAQARgpIGUoYTAP&rs=AOn4CLAmpPmyzn4-PqH-Rwlh90Vcr0E6Lw',
    label: '"Les ambassadeurs du chauffage urbain" 2',
    linkUrl: 'https://www.youtube.com/watch?v=wtNmhwa5_DA',
  },
  {
    eventKey: 'Vidéo',
    imgUrl:
      'https://i.ytimg.com/vi/2mO97aF1T4c/hqdefault.jpg?sqp=-oaymwE2CNACELwBSFXyq4qpAygIARUAAIhCGAFwAcABBvABAfgB_gmAAtAFigIMCAAQARggIFkocjAP&rs=AOn4CLDFZlsDFEbwti9vsFLdvElSvrRQjw',
    label: '"Les ambassadeurs du chauffage urbain" 3',
    linkUrl: 'https://www.youtube.com/watch?v=2mO97aF1T4c',
  },
  {
    eventKey: 'Vidéo',
    imgUrl:
      'https://i.ytimg.com/vi/wieL5MpMtnE/hqdefault.jpg?sqp=-oaymwE2CNACELwBSFXyq4qpAygIARUAAIhCGAFwAcABBvABAfgB_gmAAtAFigIMCAAQARgqIGUoYTAP&rs=AOn4CLAMR8N6VE6PxlIeOMAO_wEU9d0JMA',
    label: '"Les ambassadeurs du chauffage urbain" 4',
    linkUrl: 'https://www.youtube.com/watch?v=wieL5MpMtnE',
  },
  {
    eventKey: 'Vidéo',
    imgUrl:
      'https://i.ytimg.com/vi/eDnhC9l5pWI/hqdefault.jpg?sqp=-oaymwE2CNACELwBSFXyq4qpAygIARUAAIhCGAFwAcABBvABAfgB_gmAAtAFigIMCAAQARgjIF0ocjAP&rs=AOn4CLD799UTnieTrHU91zGPBKL-CUZRLw',
    label: '"Les ambassadeurs du chauffage urbain" 5',
    linkUrl: 'https://www.youtube.com/watch?v=eDnhC9l5pWI',
  },
  {
    eventKey: 'Vidéo',
    imgUrl: 'https://img.youtube.com/vi/c2Qgctn9SVY/maxresdefault.jpg', // pas réussi à avoir l'image hqdefault sans bandes noires en haut et en bas
    label: '"Les ambassadeurs du chauffage urbain" 6',
    linkUrl: 'https://www.youtube.com/watch?v=c2Qgctn9SVY',
  },
  {
    eventKey: 'Vidéo',
    imgUrl:
      'https://i.ytimg.com/vi/ebUNfVsXBIQ/hqdefault.jpg?sqp=-oaymwE2CNACELwBSFXyq4qpAygIARUAAIhCGAFwAcABBvABAfgB_gmAAtAFigIMCAAQARgaIGUoWjAP&rs=AOn4CLC52Akpiu6WOi8r1kNZf8OQyyg3lQ',
    label: 'Ochôde explique la géothermie',
    linkUrl: 'https://www.youtube.com/watch?v=ebUNfVsXBIQ',
  },
];

const guides: InfographieItemProps[] = [
  {
    eventKey: 'Téléchargement|Guide FCU|coproprietaire',
    imgUrl: '/img/supports_guide_coproprietes.webp',
    label: 'Guide Copropriétés',
    linkUrl: '/documentation/guide-france-chaleur-urbaine.pdf',
  },
  {
    eventKey: 'Téléchargement|Guide Exploitants|Collectivités et exploitants',
    imgUrl: '/img/supports_guide_exploitants.webp',
    label: 'Guide Exploitants',
    linkUrl: '/documentation/FCU_guide_exploitants.pdf',
  },
  {
    eventKey: 'Téléchargement|Guide Collectivités|Collectivités et exploitants',
    imgUrl: '/img/supports_guide_collectivites.webp',
    label: 'Guide Collectivités',
    linkUrl: '/documentation/FCU_guide_collectivites.pdf',
  },
];

const SupportsPage = () => {
  return (
    <SimplePage
      title="Nos supports pédagogiques sur les réseaux de chaleur"
      description="Comprendre de façon simple et rapide les réseaux de chaleur, via des supports accessibles à tous : fonctionnement, atouts, état des lieux, enjeux…"
    >
      <Hero variant="ressource" image="/img/ressources_header.webp" imagePosition="right" imageType="inline">
        <HeroTitle>Nos supports pédagogiques</HeroTitle>
        <HeroSubtitle>
          Retrouvez tous nos supports de communication pour comprendre simplement et rapidement les enjeux liés aux réseaux de chaleur ou
          mieux connaître notre service.
        </HeroSubtitle>
      </Hero>

      <Section id="infographies">
        <SectionTitle>Infographies</SectionTitle>
        <SectionContent>
          <div className="flex items-baseline gap-4 flex-wrap">
            {infographies.map((item, index) => (
              <InfographieItem {...item} key={index} />
            ))}
          </div>
        </SectionContent>
      </Section>

      <Section variant="light" id="reportages">
        <SectionTitle>Reportages</SectionTitle>
        <SectionContent>
          <div className="flex items-baseline gap-4 flex-wrap">
            {reportages.map((item, index) => (
              <InfographieItem {...item} key={index} />
            ))}
          </div>
        </SectionContent>
      </Section>

      <Section id="videos">
        <SectionTitle>Vidéos</SectionTitle>
        <SectionContent>
          <div className="flex items-baseline gap-4 flex-wrap">
            {videos.map((item, index) => (
              <InfographieItem width={230} {...item} key={index} />
            ))}
          </div>
        </SectionContent>
      </Section>

      <Section variant="light" id="guides">
        <SectionTitle>Guides</SectionTitle>
        <SectionContent>
          <div className="flex items-baseline gap-4 flex-wrap">
            {guides.map((item, index) => (
              <InfographieItem {...item} key={index} />
            ))}
          </div>
        </SectionContent>
      </Section>
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
      <img src={props.imgUrl} alt={`Aperçu de l'infographie : ${props.label}`} loading="lazy" width={width} />
      <Text size="sm" p="1v">
        {props.label}
      </Text>
    </Link>
  </StyledInfographieItem>
);
