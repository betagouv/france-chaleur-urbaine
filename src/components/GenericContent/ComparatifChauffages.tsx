import Image from 'next/image';

import { ArrowPuce } from '@components/MarkdownWrapper/MarkdownWrapper.style';
import Box, { ResponsiveRow } from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import Text from '@components/ui/Text';

const ComparatifChauffage = () => {
  return (
    <Box className="fr-container">
      <Heading as="h2" center>
        Comparatif des modes de chauffage
      </Heading>
      <ResponsiveRow mt="8w">
        <Box flex>
          <Image src="/img/chauffage_collectif_fioul.svg" alt="" width="270" height="206" priority className="d-block img-object-contain" />
          <Heading as="h3" mt="3w" legacyColor="darkerblue">
            Chauffage collectif au fioul
          </Heading>
          <Box>
            <ArrowPuce>
              <Text size="lg" legacyColor="black">
                Importantes émissions de gaz à effet de serre
              </Text>
            </ArrowPuce>
            <ArrowPuce>
              <Text size="lg" legacyColor="black">
                Énergie importée, dont l'approvisionnement est sensible au contexte géopolitique
              </Text>
            </ArrowPuce>
            <ArrowPuce>
              <Text size="lg" legacyColor="black">
                Pollution de l'air (émissions de particules fines)
              </Text>
            </ArrowPuce>
            <ArrowPuce>
              <Text size="lg" legacyColor="black">
                Coût élevé pour l'entretien de la chaudière
              </Text>
            </ArrowPuce>
            <ArrowPuce>
              <Text size="lg" legacyColor="black">
                Tarifs élevés et fortement fluctuants (près de 67&nbsp;% de hausse entre septembre 2021 et août 2022)
              </Text>
            </ArrowPuce>
          </Box>
        </Box>

        <Box flex>
          <Image src="/img/chauffage_collectif_gaz.svg" alt="" width="270" height="206" priority className="d-block img-object-contain" />
          <Heading as="h3" mt="3w" legacyColor="darkerblue">
            Chauffage collectif au gaz
          </Heading>
          <Box>
            <ArrowPuce>
              <Text size="lg" legacyColor="black">
                Importantes émissions de gaz à effet de serre
              </Text>
            </ArrowPuce>
            <ArrowPuce>
              <Text size="lg" legacyColor="black">
                Entretien rigoureux des installations nécessaire pour limiter les risques associés aux chaudières
              </Text>
            </ArrowPuce>
            <ArrowPuce>
              <Text size="lg" legacyColor="black">
                Tarifs fortement fluctuants
              </Text>
            </ArrowPuce>
            <ArrowPuce>
              <Text size="lg" legacyColor="black">
                Énergie importée, dont l'approvisionnement est sensible au contexte géopolitique
              </Text>
            </ArrowPuce>
          </Box>
        </Box>

        <Box flex>
          <Image src="/img/chauffage_reseau_chaleur.svg" alt="" width="270" height="206" priority className="d-block img-object-contain" />
          <Heading as="h3" mt="3w" legacyColor="darkerblue">
            Réseau de chaleur
          </Heading>
          <Box>
            <ArrowPuce>
              <Text size="lg" legacyColor="black">
                Emissions de gaz à effet de serre et particules fines limitées
              </Text>
            </ArrowPuce>
            <ArrowPuce>
              <Text size="lg" legacyColor="black">
                Absence de chaudière et de stockage au sein de l'immeuble - sécurité assurée
              </Text>
            </ArrowPuce>
            <ArrowPuce>
              <Text size="lg" legacyColor="black">
                Garantie d'un service public
              </Text>
            </ArrowPuce>
            <ArrowPuce>
              <Text size="lg" legacyColor="black">
                Tarifs moins fluctuants que ceux des énergies purement fossiles
              </Text>
            </ArrowPuce>
            <ArrowPuce>
              <Text size="lg" legacyColor="black">
                TVA à 5.5&nbsp;% pour tous les réseaux alimentés plus de 50&nbsp;% par des énergies renouvelables et de récupération
              </Text>
            </ArrowPuce>
          </Box>
        </Box>
      </ResponsiveRow>
    </Box>
  );
};

export default ComparatifChauffage;
