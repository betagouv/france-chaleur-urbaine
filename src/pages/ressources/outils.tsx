import SimplePage from '@/components/shared/page/SimplePage';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import Hero, { HeroSubtitle, HeroTitle } from '@/components/ui/Hero';
import { FCUArrowIcon } from '@/components/ui/Icon';
import Link from '@/components/ui/Link';
import Text from '@/components/ui/Text';

const OutilsPage = () => {
  return (
    <SimplePage
      title="Nos outils"
      description="Testez en masse l'éligibilité de vos bâtiments aux réseaux de chaleur, estimez le coût du raccordement et les aides disponibles, téléchargez les données…"
    >
      <Box backgroundColor="blue-cumulus-950-100">
        <Hero variant="ressource" image="/img/ressources_header.webp" imagePosition="right" imageType="inline">
          <HeroTitle>Nos outils</HeroTitle>
          <HeroSubtitle>Accédez aux différents outils mis à disposition par France Chaleur Urbaine.</HeroSubtitle>
        </Hero>
      </Box>
      <Box py="5w" className="fr-container">
        <Heading as="h2" size="h3" color="blue-france" mb="0">
          Test d’adresses en masse
        </Heading>
        <Box display="flex" my="2w">
          <FCUArrowIcon />
          <Text size="lg" ml="1w">
            Repérer sur un parc de bâtiments ceux potentiellement raccordables, et accéder aux caractéristiques des réseaux les plus proches
          </Text>
        </Box>
        <Link variant="secondary" href="/?bulk">
          Accéder
        </Link>
      </Box>
      <Box backgroundColor="blue-france-975-75" id="iframes">
        <Box py="5w" className="fr-container">
          <Heading as="h2" size="h3" color="blue-france" mb="0">
            Iframes
          </Heading>
          <Box display="flex" my="2w">
            <FCUArrowIcon />
            <Text size="lg" ml="1w">
              Intégrer dans un site internet notre test d’adresse et notre carte, en un copier-coller
            </Text>
          </Box>
          <Link variant="secondary" href="/collectivites-et-exploitants#iframe-carte">
            Accéder
          </Link>
        </Box>
      </Box>
      <Box py="5w" className="fr-container">
        <Heading as="h2" size="h3" color="blue-france" mb="0">
          API
        </Heading>
        <Box display="flex" my="2w">
          <FCUArrowIcon />
          <Text size="lg" ml="1w">
            Intégrer l’API du test d’adresse ou des réseaux
          </Text>
        </Box>
        <Link variant="secondary" href="https://www.data.gouv.fr/fr/dataservices/api-france-chaleur-urbaine/" isExternal>
          Accéder
        </Link>
      </Box>
      <Box backgroundColor="blue-france-975-75">
        <Box py="5w" className="fr-container">
          <Heading as="h2" size="h3" color="blue-france" mb="0">
            Téléchargement de données
          </Heading>
          <Box display="flex" my="2w">
            <FCUArrowIcon />
            <Text size="lg" ml="1w">
              Télécharger les données et tracés des réseaux
            </Text>
          </Box>
          <Link variant="secondary" href="https://www.data.gouv.fr/fr/datasets/traces-des-reseaux-de-chaleur-et-de-froid/" isExternal>
            Accéder
          </Link>
        </Box>
      </Box>
      <Box py="5w" className="fr-container">
        <Heading as="h2" size="h3" color="blue-france" mb="0">
          Simulateur d’aides
        </Heading>
        <Box display="flex" my="2w">
          <FCUArrowIcon />
          <Text size="lg" ml="1w">
            Evaluer le montant des aides pour le raccordement de votre bâtiment (coup de pouce chauffage des bâtiments résidentiels
            collectifs et tertiaires)
          </Text>
        </Box>
        <Link variant="secondary" href="/professionnels#simulateur-aide">
          Accéder
        </Link>
      </Box>
      <Box backgroundColor="blue-france-975-75">
        <Box py="5w" className="fr-container">
          <Heading as="h2" size="h3" color="blue-france" mb="0">
            Comparateur de performances
          </Heading>
          <Box display="flex" my="2w">
            <FCUArrowIcon />
            <Text size="lg" ml="1w">
              Comparer les coûts et les émissions de CO2 des modes de chauffage et de refroidissement
            </Text>
          </Box>
          <Link variant="secondary" href="/comparateur-couts-performances">
            Accéder
          </Link>
        </Box>
      </Box>
      <Box py="5w" className="fr-container">
        <Heading as="h2" size="h3" color="blue-france" mb="0" mt="8w">
          Simulateur de CO2
        </Heading>
        <Box display="flex" my="2w">
          <FCUArrowIcon />
          <Text size="lg" ml="1w">
            Estimer les émissions de CO2 évitées grâce au raccordement
          </Text>
        </Box>
        <Link variant="secondary" href="/professionnels#simulateur-co2">
          Accéder
        </Link>
      </Box>
      <Box backgroundColor="blue-france-975-75">
        <Box py="5w" className="fr-container">
          <Heading as="h2" size="h3" color="blue-france" mb="0">
            Fiches par réseau
          </Heading>
          <Box display="flex" my="2w">
            <FCUArrowIcon />
            <Text size="lg" ml="1w">
              Modifier ou compléter la fiche d’un réseau
            </Text>
          </Box>
          <Link variant="secondary" href="/reseaux/modifier">
            Accéder
          </Link>
        </Box>
      </Box>
      <Box py="5w" className="fr-container">
        <Heading as="h2" size="h3" color="blue-france" mb="0">
          Liste des réseaux de chaleur
        </Heading>
        <Box display="flex" my="2w">
          <FCUArrowIcon />
          <Text size="lg" ml="1w">
            Retrouver l'ensemble des réseaux et les filtrer selon leurs caractéristiques
          </Text>
        </Box>
        <Link variant="secondary" href="/reseaux">
          Accéder
        </Link>
      </Box>
    </SimplePage>
  );
};

export default OutilsPage;
