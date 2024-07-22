import Image from 'next/image';
import { PropsWithChildren } from 'react';

import SimplePage from '@components/shared/page/SimplePage';
import Slideshow from '@components/Slideshow';
import Box from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import Text from '@components/ui/Text';

const ActionsDeCommunicationPage = () => {
  return (
    <SimplePage title="Nos actions de communication - France Chaleur Urbaine">
      <Box backgroundColor="blue-cumulus-950-100">
        <Box display="flex" gap="16px" maxWidth="1000px" mx="auto" pt="8w" px="2w">
          <Box flex>
            <Heading size="h1" color="blue-france">
              Nos actions de communication
            </Heading>
            <Text size="lg" mb="3w">
              France Chaleur Urbaine aide les collectivités et les exploitants à faire la promotion du chauffage urbain et à rendre les
              réseaux plus visibles en ligne et dans les villes sur différents supports.
            </Text>
          </Box>

          <Box className="fr-hidden fr-unhidden-lg">
            <Image src="/img/ressources_header.webp" alt="" width={152} height={180} priority />
          </Box>
        </Box>
      </Box>

      <Box pt="10w" pb="4w" className="fr-container">
        <Heading size="h2" color="blue-france" center>
          Campagnes publicitaires locales
        </Heading>
      </Box>

      <Box backgroundColor="blue-france-975-75">
        <Box py="5w" className="fr-container">
          <Heading size="h5" color="blue-france" mb="6w" center>
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

      <Box pt="6w" className="fr-container">
        <Box className="fr-grid-row fr-grid-row--gutters">
          <Box display="flex" flexDirection="column" gap="16px" className="fr-col fr-col-12 fr-col-lg-6">
            <Heading size="h3" color="blue-france" mb="0">
              Réseaux Evos à Strasbourg
            </Heading>
            <Text size="xs" legacyColor="lightgrey">
              <span className="fr-icon--sm fr-icon-arrow-right-line fr-mr-1w" />
              Janvier 2024
            </Text>
            <Text size="lg">
              Porter à 80% le taux d’énergies renouvelables du réseau EVOS, aujourd’hui alimenté exclusivement au gaz, est le défi que
              s’engagent à relever l’Eurométropole de Strasbourg et son délégataire ENGIE Solutions. Grâce à ce projet, les abonnés et
              futurs abonnés vont bénéficier d’un chauffage écologique et de tarifs plus stables et compétitifs. France Chaleur Urbaine
              accompagne EVOS pour permettre au réseau de gagner en notoriété positive.
            </Text>
          </Box>
          <Box className="fr-col fr-col-12 fr-col-lg-6">
            <Slideshow
              images={[
                '/img/campagnes_strasbourg_1.webp',
                '/img/campagnes_strasbourg_2.webp',
                '/img/campagnes_strasbourg_3.webp',
                '/img/campagnes_strasbourg_4.webp',
              ]}
            />
          </Box>
        </Box>
      </Box>

      <Box pt="10w" className="fr-container">
        <Box className="fr-grid-row fr-grid-row--gutters">
          <Box display="flex" flexDirection="column" gap="16px" className="fr-col fr-col-12 fr-col-lg-6">
            <Heading size="h3" color="blue-france" mb="0">
              Fresnes
            </Heading>
            <Text size="xs" legacyColor="lightgrey">
              <span className="fr-icon--sm fr-icon-arrow-right-line fr-mr-1w" />
              Décembre 2023
            </Text>
            <Text size="lg">
              Pour atteindre 100% de logements collectifs raccordés et un taux d'énergies renouvelables de 80%, la ville de Fresnes a décidé
              de créer plus de 5 km d’extension de son réseau, et de réaliser une nouvelle installation géothermique. France Chaleur Urbaine
              a accompagné la ville et son délégataire Coriance dans une campagne de communication multi-supports&nbsp;: publicité pour le
              journal communal, affiches pour abribus et espaces d’affichage de la ville, ainsi qu’une petite vidéo pédagogique pour
              expliquer la géothermie aux plus jeunes.
            </Text>
          </Box>
          <Box className="fr-col fr-col-12 fr-col-lg-6">
            <Slideshow
              images={[
                '/img/campagnes_fresnes_1.webp',
                '/img/campagnes_fresnes_2.webp',
                '/img/campagnes_fresnes_3.webp',
                '/img/campagnes_fresnes_4.webp',
              ]}
            />
          </Box>
        </Box>
      </Box>

      <Box pt="10w" className="fr-container">
        <Box className="fr-grid-row fr-grid-row--gutters">
          <Box display="flex" flexDirection="column" gap="16px" className="fr-col fr-col-12 fr-col-lg-6">
            <Heading size="h3" color="blue-france" mb="0">
              Charleville-Mézières
            </Heading>
            <Text size="xs" legacyColor="lightgrey">
              <span className="fr-icon--sm fr-icon-arrow-right-line fr-mr-1w" />
              Octobre 2023
            </Text>
            <Text size="lg">
              De juillet 2023 à décembre 2024, le réseau de chaleur de Charleville-Mézières est étendu sur plus de 13 km. Cette période de
              travaux est un moment clé pour faire connaître le chauffage urbain et convaincre de nouveaux prospects de se raccorder. France
              Chaleur Urbaine a réalisé pour la ville et son délégataire Dalkia des visuels pour le journal communal, les bâches travaux, et
              de l’affichage sur abribus. Grâce à un relai actif par la collectivité, cette campagne a généré plus de 50 demandes de
              raccordement en 2 mois.
            </Text>
          </Box>
          <Box className="fr-col fr-col-12 fr-col-lg-6">
            <Slideshow
              images={[
                '/img/campagnes_charleville-mezieres_1.webp',
                '/img/campagnes_charleville-mezieres_2.webp',
                '/img/campagnes_charleville-mezieres_3.webp',
                '/img/campagnes_charleville-mezieres_4.webp',
              ]}
            />
          </Box>
        </Box>
      </Box>

      <Box py="10w" className="fr-container">
        <Box className="fr-grid-row fr-grid-row--gutters">
          <Box display="flex" flexDirection="column" gap="16px" className="fr-col fr-col-12 fr-col-lg-6">
            <Heading size="h3" color="blue-france" mb="0">
              Bordeaux
            </Heading>
            <Text size="xs" legacyColor="lightgrey">
              <span className="fr-icon--sm fr-icon-arrow-right-line fr-mr-1w" />
              Mars 2023
            </Text>
            <Text size="lg">
              En mars 2023, France Chaleur Urbaine réalise sa première campagne d’affichage sur abribus, pour valoriser les réseaux de
              Bordeaux Métropole. 166 affiches sont installées sur Bordeaux rive droite, pendant une semaine.
            </Text>
          </Box>
          <Box className="fr-col fr-col-12 fr-col-lg-6">
            <Slideshow images={['/img/campagnes_bordeaux_1.webp', '/img/campagnes_bordeaux_2.webp', '/img/campagnes_bordeaux_3.webp']} />
          </Box>
        </Box>
      </Box>
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
