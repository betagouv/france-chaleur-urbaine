import { WhiteArrowPuce } from '@components/MarkdownWrapper/MarkdownWrapper.style';
import Box, { ResponsiveRow } from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import Link from '@components/ui/Link';
import Text from '@components/ui/Text';
import Image from 'next/image';

type DownloadLinkPos = 'right' | 'left';

const HowToRaccordement = ({
  downloadLinkPos,
}: {
  downloadLinkPos?: DownloadLinkPos;
}) => {
  return (
    <Box className="fr-container">
      <Heading as="h2" legacyColor="white" center>
        Comment se raccorder
      </Heading>
      <ResponsiveRow mt="10w">
        <Box flex>
          <Heading as="h4" legacyColor="white" mb="4w">
            France Chaleur Urbaine est un service public qui vous met en lien
            avec le gestionnaire du réseau de chaleur
          </Heading>

          <WhiteArrowPuce>
            <Text size="lg">Vérifiez que votre adresse est raccordable</Text>
          </WhiteArrowPuce>
          <WhiteArrowPuce>
            <Text size="lg">
              Déposez une demande sur France Chaleur Urbaine
            </Text>
          </WhiteArrowPuce>
          <WhiteArrowPuce>
            <Text size="lg">
              France Chaleur Urbaine transmet votre demande au gestionnaire du
              réseau le plus proche de chez vous
            </Text>
          </WhiteArrowPuce>
          <WhiteArrowPuce>
            <Text size="lg">
              Le gestionnaire vous recontacte pour étudier avec vous votre
              projet de raccordement
            </Text>
          </WhiteArrowPuce>
          {downloadLinkPos !== 'right' && (
            <Link
              href="/documentation/guide-france-chaleur-urbaine.pdf"
              variant="primary"
              isExternal
              eventKey="Téléchargement|Guide FCU|coproprietaire"
              mt="2w"
            >
              Télécharger le guide de raccordement
            </Link>
          )}
        </Box>

        <Box flex>
          <Image
            src="/img/copro_guide_raccordement.webp"
            alt="Guide de raccordement à un réseau de chaleur"
            width={450}
            height={346}
            className="fr-responsive-img"
          />
          {downloadLinkPos === 'right' && (
            <Link
              href="/documentation/guide-france-chaleur-urbaine.pdf"
              variant="primary"
              isExternal
              eventKey="Téléchargement|Guide FCU|coproprietaire"
              mt="2w"
            >
              Télécharger le guide de raccordement
            </Link>
          )}
        </Box>
      </ResponsiveRow>
    </Box>
  );
};

export default HowToRaccordement;
