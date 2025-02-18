import Image from 'next/image';

import SimulateurCoutRaccordement from '@/components/Ressources/Contents/SimulateurCoutRaccordement';
import SimplePage from '@/components/shared/page/SimplePage';
import Box, { ResponsiveRow } from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import Link from '@/components/ui/Link';
import Text from '@/components/ui/Text';

const CoutsChauffageUrbainPage = () => {
  return (
    <SimplePage
      title="Nos actions de communication sur la chaleur urbaine"
      description="France Chaleur Urbaine aide les collectivités à faire connaître et valoriser leurs réseaux de chaleur sur leur territoire."
    >
      <Box backgroundColor="blue-cumulus-950-100">
        <Box display="flex" gap="16px" maxWidth="1000px" mx="auto" pt="8w" px="2w">
          <Box flex>
            <Heading as="h1" color="blue-france">
              Les coûts du chauffage urbain
            </Heading>
          </Box>

          <Box className="fr-hidden fr-unhidden-lg">
            <Image src="/img/ressources_header.webp" alt="" width={152} height={180} priority />
          </Box>
        </Box>
      </Box>
      <Box className="fr-container pb-10w">
        <Box mt="10w">
          <Heading as="h3" size="h4" color="blue-france">
            Le coût du raccordement
          </Heading>
          <Text>
            Le coup de pouce <Link href="/ressources/aides#contenu">"Chauffage des bâtiments résidentiels collectifs et tertiaires”</Link>{' '}
            permet d’obtenir des aides financières conséquentes pour se raccorder. Le coût du raccordement peut ainsi être réduit à quelques
            centaines d’euros par logement.
          </Text>
          <Text my="3w">
            Différentes entreprises signataires de la charte "Chauffage des bâtiments résidentiels collectifs et tertiaires” offrent cette
            prime.{' '}
            <strong>
              Le montant de la prime peut significativement varier d’une entreprise à l’autre, il est donc important de comparer les offres
              proposées.
            </strong>
          </Text>
          <Box>
            <SimulateurCoutRaccordement embedded />
          </Box>
        </Box>

        <Heading as="h3" size="h4" color="blue-france" mt="10w">
          Le coût de la chaleur
        </Heading>
        <ResponsiveRow>
          <Box flex>
            <Text>
              Le <Link href="/chauffage-urbain#contenu">chauffage urbain</Link> est en moyenne le mode de chauffage le moins cher sur le
              marché pour les logements en habitat collectif (copropriété, logement social...), devant le gaz, l’électricité et le fioul.
              L’usage d’énergies locales assure également une certaine stabilité des prix.
            </Text>
            <Text mt="3w">
              Retrouvez le prix moyen de la chaleur pour les réseaux classés sur les fiches accessibles depuis notre{' '}
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
              Coût global annuel chauffage + eau chaude sanitaire pour un logement moyen (70&nbsp;m²) construit entre 2005 et 2012
              (consommation : 96&nbsp;kWhu/m²/an). Enquête sur le prix de vente de la chaleur et du froid 2022 (Amorce 2023)
            </Text>
          </Box>
        </ResponsiveRow>
      </Box>
    </SimplePage>
  );
};

export default CoutsChauffageUrbainPage;
