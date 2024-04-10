import { Separator } from '@components/HeadSliceForm/HeadSliceForm.style';
import IFrameParametrization from '../Map/IFrameParametrization';
import IFrameLink from './IFrameLink';
import Box, { ResponsiveRow } from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import Text from '@components/ui/Text';
import Image from 'next/image';

const IFrame = () => {
  return (
    <Box className="fr-container">
      <ResponsiveRow mt="10w">
        <Box flex>
          <Box flex>
            <Heading as="h4" color="blue-france">
              Intégrez notre cartographie ou notre test d'adresses à votre site
              à l'instar de Charleville-Mézières, Strasbourg, Tours, l'ALEC de
              Lyon...
            </Heading>
            <Text size="lg">
              Offrez aux visiteurs de votre site la possibilité de vérifier
              s'ils sont raccordables ou de visualiser votre réseau directement
              depuis votre votre site internet.
            </Text>
            <Text size="lg" mt="3w">
              Nous mettons à votre disposition deux iframes que vous pouvez
              librement utiliser en un simple copié/collé
            </Text>
          </Box>

          <Box flex mt="8w">
            <Heading as="h6" color="blue-france">
              1- Iframe cartographie
            </Heading>
            <Separator />
            <IFrameParametrization />
          </Box>
        </Box>
        <Box flex>
          <Image
            src="/img/iframe.svg"
            alt=""
            width={496}
            height={393}
            className="fr-responsive-img"
          />
          <Box mt="8w">
            <Heading as="h6" color="blue-france">
              2- Iframe test d'adresse
            </Heading>
            <Text size="lg" my="2w">
              Intégrez le champ de recherche sur votre site en copiant ces
              lignes de code :
            </Text>

            <IFrameLink
              link={`
  <iframe
  width="100%"
  title="France chaleur urbaine - Éligibilité"
  src="https://france-chaleur-urbaine.beta.gouv.fr/form"
  />
  `}
            />
            <Text size="sm" mt="2w" legacyColor="darkerblue">
              Ajustez les valeurs des variables "width" et "height" pour obtenir
              un affichage optimal sur votre site.
            </Text>
          </Box>
        </Box>
      </ResponsiveRow>
      {/* <Slice padding={4} id="iframe-carte" direction="row">
        <WrappedText imgSrc="/img/iframe-carte.png" reverse>
          <IFrameParametrization />
        </WrappedText>
      </Slice> */}
    </Box>
  );
};

export default IFrame;
