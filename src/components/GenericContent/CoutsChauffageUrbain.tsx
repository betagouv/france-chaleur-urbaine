import SimulateurCoutRaccordement from '@components/Ressources/Contents/SimulateurCoutRaccordement';
import Box, { ResponsiveRow } from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import Link from '@components/ui/Link';
import Text from '@components/ui/Text';
import Image from 'next/image';

const CoutsChauffageUrbain = () => {
  return (
    <Box className="fr-container">
      <Heading as="h2" center>
        Les coûts du chauffage urbain
      </Heading>

      <Box mt="10w">
        <Heading as="h4" color="blue-france">
          Le coût du raccordement
        </Heading>
        <Text>
          Le coup de pouce{' '}
          <Link href="/ressources/aides#contenu">
            "Chauffage des bâtiments résidentiels collectifs et tertiaires”
          </Link>{' '}
          permet d’obtenir des aides financières conséquentes pour se raccorder.
          Le coût du raccordement peut ainsi être réduit à quelques centaines
          d’euros par logement.
        </Text>
        <Text my="3w">
          Différentes entreprises signataires de la charte "Chauffage des
          bâtiments résidentiels collectifs et tertiaires” offrent cette prime.{' '}
          <strong>
            Le montant de la prime peut significativement varier d’une
            entreprise à l’autre, il est donc important de comparer les offres
            proposées.
          </strong>
        </Text>
        <Box>
          <SimulateurCoutRaccordement embedded />
        </Box>
      </Box>

      <Heading as="h4" color="blue-france" mt="4w">
        Le coût de la chaleur
      </Heading>
      <ResponsiveRow>
        <Box flex>
          <Text>
            Le <Link href="/chauffage-urbain#contenu">chauffage urbain</Link>{' '}
            est en moyenne le mode de chauffage le moins cher sur le marché pour
            les logements en habitat collectif (copropriété, logement
            social...), devant le gaz, l’électricité et le fioul. L’usage
            d’énergies locales assure également une certaine stabilité des prix.
          </Text>
          <Text mt="3w">
            Retrouvez le prix moyen de la chaleur pour les réseaux classés sur
            les fiches accessibles depuis notre{' '}
            <Link href="/carte">cartographie</Link>.
          </Text>
        </Box>
        <Box flex>
          <Image
            src="/img/copro_cout_chaleur.webp"
            alt="Graphique comparatif du coût des méthodes de chauffage"
            width={944}
            height={499}
            className="fr-responsive-img"
          />
          <Text size="xs">
            Coût global annuel chauffage + eau chaude sanitaire pour un logement
            moyen (70&nbsp;m²) construit entre 2005 et 2012 (consommation :
            96&nbsp;kWhu/m²/an). Enquête sur le prix de vente de la chaleur et
            du froid 2022 (Amorce 2023)
          </Text>
        </Box>
      </ResponsiveRow>
    </Box>
  );
};

export default CoutsChauffageUrbain;
