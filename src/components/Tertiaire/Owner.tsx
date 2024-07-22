import Box, { ResponsiveRow } from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import Text from '@components/ui/Text';
import Link from '@components/ui/Link';

const Owner = () => {
  return (
    <Box className="fr-container" id="decrettertiaire" py="10w">
      <Heading as="h2" center>
        Vous êtes propriétaire ou exploitant d’un établissement tertiaire
      </Heading>
      <ResponsiveRow mt="10w">
        <Box flex>
          <Box>
            <Text size="lg">
              Si vos bâtiments présentent une surface d’activités tertiaires (ou
              un cumul de surfaces) égale ou supérieure à 1 000 m²
            </Text>
            <Text size="lg" mt="3w">
              &rarr;&nbsp;vous êtes assujettis au dispositif éco-énergie
              tertiaire&nbsp;!
            </Text>
            <Text size="lg" mt="3w">
              Pour atteindre les objectifs du dispositif, vous pouvez optimiser
              l'exploitation de vos bâtiments, moderniser vos équipements, ou
              encore engager des travaux de rénovation énergétique.
            </Text>
            <Text size="lg" mt="3w">
              C’est aussi le moment de changer votre mode de chauffage pour une
              solution moins émettrice de gaz à effet de serre&nbsp;!
            </Text>
          </Box>
          <Box
            backgroundColor="background-action-low-blue-france"
            mt="3w"
            py="4w"
            px="2w"
          >
            <ResponsiveRow alignItems="center" gap="20px">
              <Box textColor="#4550E5">
                <Text size="lead" fontWeight="bold">
                  Obligation
                </Text>
                <Text size="md" fontWeight="bold">
                  de réduction des consommations d’énergie finale de l’ensemble
                  parc tertaire d’au moins* :
                </Text>
                <Text size="xs">
                  <Link
                    href="https://www.ecologie.gouv.fr/sites/default/files/20064_EcoEnergieTertiaire-4pages-web.pdf"
                    isExternal
                  >
                    * En savoir plus
                  </Link>
                </Text>
              </Box>
              <Box fontWeight="bold" textColor="#ffffff">
                <ResponsiveRow alignItems="center" gap="20px">
                  <Box backgroundColor="#27a658" py="1w" px="2w">
                    <Text size="md">-40%</Text>
                    <Text size="xs">en&nbsp;2030</Text>
                  </Box>
                  <Box backgroundColor="#27a658" py="1w" px="2w">
                    <Text size="md">-50%</Text>
                    <Text size="xs">en&nbsp;2040</Text>
                  </Box>
                  <Box backgroundColor="#27a658" py="1w" px="2w">
                    <Text size="md">-60%</Text>
                    <Text size="xs">en&nbsp;2050</Text>
                  </Box>
                </ResponsiveRow>
              </Box>
            </ResponsiveRow>
          </Box>
        </Box>

        <Box flex>
          <Box>
            <Text size="lg">
              Le 13 avril 2022, un arrêté modifiant celui du 10 avril 2020
              relatif aux obligations d’actions de réduction des consommations
              d’énergie finale dans des bâtiments à usage tertiaire a été
              publié.
            </Text>
            <Text size="lg">
              Il spécifie qu’un coefficient de 0,77 sera appliqué aux
              consommations d’énergie des bâtiments raccordés aux réseaux de
              chaleur.
            </Text>
          </Box>
          <Box
            backgroundColor="blue-france-main-525"
            mt="3w"
            px="4w"
            py="2w"
            textColor="#ffffff"
            fontWeight="bold"
          >
            <Text size="lg">Se raccorder à un réseau de chaleur, c’est :</Text>
            <ResponsiveRow alignItems="center" mt="2w">
              <Box textColor="#F8D86E">
                <Text fontSize="45px">23&nbsp;%</Text>
              </Box>
              <Box>
                <Text size="lg">
                  de réduction de consommations d’énergie comptabilisée&nbsp;!
                </Text>
              </Box>
            </ResponsiveRow>
          </Box>
        </Box>
      </ResponsiveRow>
    </Box>
  );
};

export default Owner;
