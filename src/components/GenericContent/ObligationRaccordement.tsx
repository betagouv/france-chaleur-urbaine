import Box, { ResponsiveRow } from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import Link from '@components/ui/Link';
import Text from '@components/ui/Text';

const ObligationRaccordement = () => {
  return (
    <Box className="fr-container">
      <Heading as="h2" center>
        Les obligations de raccordement
      </Heading>
      <ResponsiveRow mt="10w">
        <Box flex>
          <Heading as="h4" color="blue-france">
            Les réseaux classés
          </Heading>
          <Text size="lg">
            Plus de 500 réseaux de chaleur sont désormais <Link href="/ressources/reseau-classe#contenu">“classés”</Link>, ce qui signifie
            que certains bâtiments ont l'obligation de se raccorder.
          </Text>
          <Text size="lg" mt="3w">
            Cette obligation s’applique dans une certaine zone autour du réseau, définie par la collectivité, qualifiée de périmètre de
            développement prioritaire.
          </Text>

          <Box backgroundColor="yellow-moutarde-main-679" borderRadius="12px" p="3w" pt="4w" mt="3w" textColor="#fff" fontWeight="bold">
            <Text>
              <Text as="span" fontSize="32px">
                300 000€
              </Text>{' '}
              d’amende
            </Text>
            <Text>en cas de non-raccordement sans dérogation</Text>
          </Box>
        </Box>

        <Box flex>
          <Text size="lg" mt="8w">
            Sont concernés :
          </Text>
          <Text size="lg" mt="2w">
            Tout bâtiment neuf dont les besoins de chauffage sont supérieurs à 30kW*
          </Text>
          <Text size="lg" mt="2w">
            Tout bâtiment renouvelant son installation de chauffage au-dessus de 30kW*
          </Text>
          <Text size="sm">* Ce seuil de puissance peut être relevé par la collectivité</Text>

          <Link variant="primary" href="/carte" mt="6w">
            Voir les réseaux classés sur la carte
          </Link>
        </Box>
      </ResponsiveRow>
    </Box>
  );
};

export default ObligationRaccordement;
