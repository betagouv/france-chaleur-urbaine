import { type PropsWithChildren } from 'react';

import SimplePage from '@/components/shared/page/SimplePage';
import Slideshow from '@/components/Slideshow';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import Hero, { HeroSubtitle, HeroTitle } from '@/components/ui/Hero';
import Image from '@/components/ui/Image';
import Text from '@/components/ui/Text';

const ActionsDeCommunicationPage = () => {
  return (
    <SimplePage
      title="Nos actions de communication sur la chaleur urbaine"
      description="France Chaleur Urbaine aide les collectivités à faire connaître et valoriser leurs réseaux de chaleur sur leur territoire."
    >
      <Hero variant="ressource" image="/img/ressources_header.webp" imagePosition="right" imageType="inline">
        <HeroTitle>Nos actions de communication</HeroTitle>
        <HeroSubtitle>
          France Chaleur Urbaine aide les collectivités et les exploitants à faire la promotion du chauffage urbain et à rendre les réseaux
          plus visibles en ligne et dans les villes sur différents supports.
        </HeroSubtitle>
      </Hero>

      <Box pt="10w" pb="4w" className="fr-container">
        <Heading as="h2" color="blue-france" center>
          Campagnes publicitaires locales
        </Heading>
      </Box>

      <Box backgroundColor="blue-france-975-75">
        <Box py="5w" className="fr-container">
          <Heading as="h5" color="blue-france" mb="6w" center>
            Comment organiser une campagne avec France Chaleur Urbaine&nbsp;?
          </Heading>
          <Box display="flex" gap="48px">
            <Image src="/img/campagnes_organisation.webp" alt="" width={240} height={201} priority className="fr-hidden fr-unhidden-md" />

            <Box className="fr-grid-row fr-grid-row--gutters">
              <Box display="flex" className="fr-col-12 fr-col-sm-6 fr-col-lg-4">
                <BulleNombre>1</BulleNombre>
                <Text size="xs">
                  <strong>Je définis mon projet</strong> de communication avec France Chaleur Urbaine&nbsp;: messages à passer, supports
                  mobilisables…
                </Text>
              </Box>
              <Box display="flex" className="fr-col-12 fr-col-sm-6 fr-col-lg-4">
                <BulleNombre>2</BulleNombre>
                <Text size="xs">
                  <strong>Je m’assure que les informations sont complètes sur la carte</strong> France Chaleur Urbaine (tracé du réseau
                  existant et à venir, périmètre de développement prioritaire…).
                </Text>
              </Box>
              <Box display="flex" className="fr-col-12 fr-col-sm-6 fr-col-lg-4">
                <BulleNombre>3</BulleNombre>
                <Text size="xs">
                  <strong>J’intègre sur le site de la collectivité le test d’adresse</strong> France Chaleur Urbaine et / ou la carte, par
                  le simple copier-coller d’un lien dans le code source de mon site (iframe).
                </Text>
              </Box>
              <Box display="flex" className="fr-col-12 fr-col-sm-6 fr-col-lg-4">
                <BulleNombre>4</BulleNombre>
                <Text size="xs">
                  <strong>France Chaleur Urbaine me propose des visuels personnalisés</strong>, adaptés à mon projet.
                </Text>
              </Box>
              <Box display="flex" className="fr-col-12 fr-col-sm-6 fr-col-lg-4">
                <BulleNombre>5</BulleNombre>
                <Text size="xs">
                  <strong>Je me charge de l’impression</strong> des supports et de l’affichage.
                  <br />
                  La campagne est lancée&nbsp;!
                  <br />
                  <strong>Je retrouve toutes les demandes</strong> déposées sur mon espace gestionnaire.
                </Text>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      <CardHorizontal
        ville="Saint-Denis, Pierrefitte-sur-Seine, Epinay-sur-Seine"
        date="Hiver 2024-2025"
        description="Le SMIREC, Syndicat mixte des réseaux d’énergie calorifique, exerce le service public de production et de distribution
        de chaleur et de froid pour 8 communes de Seine-Saint-Denis. Ses réseaux chauffent environ 68 000 équivalent-logements et se développent
         de façon importante. France Chaleur Urbaine a accompagné le SMIREC dans la réalisation d’une campagne de communication sur trois
         communes, avec pour objectif de faire connaître les réseaux de chaleur et leurs atouts, ainsi que de valoriser l’engagement des communes et du SMIREC."
        images={['/img/campagnes_saint_denis_1.webp']}
      />

      <CardHorizontal
        ville="Amiens"
        date="Octobre 2024"
        description="Le réseau de chaleur d'Amiens s'étend et se verdit : 25 km de réseaux de chaleur sont aujourd’hui en construction qui
        viendront s’ajouter aux 50 km existants, et en 2025, le taux d'énergies renouvelables et de récupération du réseau devrait
        atteindre 72%. La campagne d’affichage accompagnée par France Chaleur Urbaine a permis de valoriser les efforts de
        développement du réseau réalisés par la ville d’Amiens et son délégataire Amiens Energie, mais aussi de sensibiliser et
        informer les Amiénois sur ce mode de chauffage."
        images={['/img/campagnes_amiens_1.webp']}
      />

      <CardHorizontal
        ville="Réseaux Evos à Strasbourg"
        date="Janvier 2024"
        description="Porter à 80% le taux d’énergies renouvelables du réseau EVOS, aujourd’hui alimenté exclusivement au gaz, est le défi que
              s’engagent à relever l’Eurométropole de Strasbourg et son délégataire ENGIE Solutions. Grâce à ce projet, les abonnés et
              futurs abonnés vont bénéficier d’un chauffage écologique et de tarifs plus stables et compétitifs. France Chaleur Urbaine
              accompagne EVOS pour permettre au réseau de gagner en notoriété positive."
        images={[
          '/img/campagnes_strasbourg_1.webp',
          '/img/campagnes_strasbourg_2.webp',
          '/img/campagnes_strasbourg_3.webp',
          '/img/campagnes_strasbourg_4.webp',
        ]}
      />

      <CardHorizontal
        ville="Fresnes"
        date="Décembre 2023"
        description="Pour atteindre 100% de logements collectifs raccordés et un taux d'énergies renouvelables de 80%, la ville de Fresnes a décidé
              de créer plus de 5 km d’extension de son réseau, et de réaliser une nouvelle installation géothermique. France Chaleur Urbaine
              a accompagné la ville et son délégataire Coriance dans une campagne de communication multi-supports&nbsp;: publicité pour le
              journal communal, affiches pour abribus et espaces d’affichage de la ville, ainsi qu’une petite vidéo pédagogique pour
              expliquer la géothermie aux plus jeunes."
        images={[
          '/img/campagnes_fresnes_1.webp',
          '/img/campagnes_fresnes_2.webp',
          '/img/campagnes_fresnes_3.webp',
          '/img/campagnes_fresnes_4.webp',
        ]}
      />

      <CardHorizontal
        ville="Charleville-Mézières"
        date="Octobre 2023"
        description="De juillet 2023 à décembre 2024, le réseau de chaleur de Charleville-Mézières est étendu sur plus de 13 km. Cette période de
              travaux est un moment clé pour faire connaître le chauffage urbain et convaincre de nouveaux prospects de se raccorder. France
              Chaleur Urbaine a réalisé pour la ville et son délégataire Dalkia des visuels pour le journal communal, les bâches travaux, et
              de l’affichage sur abribus. Grâce à un relai actif par la collectivité, cette campagne a généré plus de 50 demandes de
              raccordement en 2 mois."
        images={[
          '/img/campagnes_charleville-mezieres_1.webp',
          '/img/campagnes_charleville-mezieres_2.webp',
          '/img/campagnes_charleville-mezieres_3.webp',
          '/img/campagnes_charleville-mezieres_4.webp',
        ]}
      />

      <CardHorizontal
        ville="Bordeaux"
        date="Mars 2023"
        description="En mars 2023, France Chaleur Urbaine réalise sa première campagne d’affichage sur abribus, pour valoriser les réseaux de
              Bordeaux Métropole. 166 affiches sont installées sur Bordeaux rive droite, pendant une semaine."
        images={['/img/campagnes_bordeaux_1.webp', '/img/campagnes_bordeaux_2.webp', '/img/campagnes_bordeaux_3.webp']}
      />
    </SimplePage>
  );
};

export default ActionsDeCommunicationPage;

const BulleNombre = ({ children }: PropsWithChildren) => (
  <Box
    backgroundColor="#DEE3FE"
    borderRadius="50%"
    minWidth="44px"
    height="44px"
    display="grid"
    placeContent="center"
    fontWeight="bold"
    fontSize="24px"
    textColor="#405AB3"
    mr="2w"
  >
    {children}
  </Box>
);

const CardHorizontal = ({ ville, date, description, images }: { ville: string; date: string; description: string; images: string[] }) => (
  <Box pt="10w" className="fr-container">
    <Box className="fr-grid-row fr-grid-row--gutters">
      <Box display="flex" flexDirection="column" gap="16px" className="fr-col fr-col-12 fr-col-lg-6">
        <Heading as="h3" color="blue-france" mb="0">
          {ville}
        </Heading>
        <Text size="xs" legacyColor="lightgrey">
          <span className="fr-icon--sm fr-icon-arrow-right-line fr-mr-1w" />
          {date}
        </Text>
        <Text size="lg">{description}</Text>
      </Box>
      <Box className="fr-col fr-col-12 fr-col-lg-6">
        <Slideshow images={images} />
      </Box>
    </Box>
  </Box>
);
