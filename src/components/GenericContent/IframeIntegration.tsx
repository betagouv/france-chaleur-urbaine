import { CartoImage } from '@components/CollectivitesExploitantsPage.style';
import IFrameMapIntegrationForm from '@components/IFrame/Map/IFrameMapIntegrationForm';
import { StyledIFrameLink } from '@components/IFrame/Map/IFrameMapIntegrationForm.styles';
import Box, { ResponsiveRow } from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import Text from '@components/ui/Text';

type PageFromType = 'copro' | 'pro';

const IframeIntegration = ({ pageFrom }: { pageFrom?: PageFromType }) => {
  return (
    <Box>
      <ResponsiveRow className="fr-container">
        <Box flex>
          <Heading as="h4" color="blue-france" id="iframe-carte">
            {pageFrom === 'pro' ? (
              <>
                Intégrez notre cartographie ou notre test d’adresses à votre
                site internet
              </>
            ) : (
              <>
                Intégrez notre cartographie ou notre test d’adresses à votre
                site à l’instar de Charleville-Mézières, Strasbourg, Tours,
                l’ALEC de Lyon...
              </>
            )}
          </Heading>
          <Text size="lg">
            Offrez aux visiteurs de votre site la possibilité de vérifier s'ils
            sont raccordables ou de visualiser les réseaux de chaleur et de
            froid depuis votre site
          </Text>
          <Text size="lg" mt="2w">
            Nous mettons à votre disposition deux iframes que vous pouvez
            librement utiliser en un simple copié/collé.
          </Text>
          <Heading as="h6" color="blue-france" mt="5w" mb="0">
            1- Iframe cartographie
          </Heading>
          <hr />
          <Text size="lg" mb="2w">
            Sélectionnez les informations que vous voulez afficher puis copier
            les lignes de code obtenues&nbsp;:
          </Text>
          <IFrameMapIntegrationForm
            label={
              <Text size="lg">
                Vous souhaitez centrer la carte sur un endroit en
                particulier&nbsp;?
              </Text>
            }
          />
          <Text
            size="sm"
            mt="3w"
            legacyColor={pageFrom === 'pro' ? 'darkerblue' : undefined}
          >
            Ajustez les valeurs des variables "width" et "height" pour obtenir
            un affichage optimal sur votre site.
          </Text>
          <Text
            size="sm"
            mt="2w"
            legacyColor={pageFrom === 'pro' ? 'darkerblue' : undefined}
          >
            Si vous souhaitez une carte personnalisée avec seulement vos
            réseaux, votre logo ou d'autres informations, n'hésitez pas à{' '}
            <a
              href="mailto:france-chaleur-urbaine@developpement-durable.gouv.fr"
              target="_blank"
              rel="noopener noreferrer"
            >
              nous contacter
            </a>
          </Text>
        </Box>

        <Box flex>
          <CartoImage src="/img/collectivite-iframe.jpg" alt="" />
          <Heading as="h6" color="blue-france" mt="5w" mb="0" id="iframe">
            2- Iframe test d’adresse
          </Heading>
          <hr />
          <Text size="lg" mb="2w">
            Intégrez le champ de recherche sur votre site en copiant ces lignes
            de code&nbsp;:
          </Text>
          <StyledIFrameLink
            link={`<iframe title="France chaleur urbaine - Éligibilité" src="https://france-chaleur-urbaine.beta.gouv.fr/form" width="100%" height="330" />`}
          />
          <Text size="sm" mt="3w" legacyColor="darkerblue">
            Ajustez les valeurs des variables "width" et "height" pour obtenir
            un affichage optimal sur votre site.
          </Text>
        </Box>
      </ResponsiveRow>
    </Box>
  );
};

export default IframeIntegration;
