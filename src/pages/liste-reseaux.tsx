import Image from 'next/image';

import NetworksList from '@components/NetworksList/NetworksList';
import SimplePage from '@components/shared/page/SimplePage';
import Box from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import Text from '@components/ui/Text';

function ListeReseaux() {
  return (
    <SimplePage title="Liste des réseaux - France Chaleur Urbaine">
      <Box backgroundColor="blue-cumulus-950-100">
        <Box display="flex" gap="16px" maxWidth="1000px" mx="auto" pt="8w" px="2w">
          <Box flex>
            <Heading size="h1" color="blue-france">
              La liste des réseaux
            </Heading>
            <Text size="lg" mb="3w">
              Retrouvez l'ensemble des fiches réseaux avec toutes leurs caractéristiques.
            </Text>
          </Box>

          <Box className="fr-hidden fr-unhidden-lg">
            <Image src="/img/ressources_header.webp" alt="" width={152} height={180} priority />
          </Box>
        </Box>
      </Box>

      <NetworksList />
    </SimplePage>
  );
}

export default ListeReseaux;
