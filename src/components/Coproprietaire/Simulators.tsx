import { WhiteArrowPuce } from '@components/MarkdownWrapper/MarkdownWrapper.style';
import Simulator from '@components/Ressources/Contents/Simulator';
import Box, { ResponsiveRow } from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import { LegacyColor } from '@components/ui/helpers/colors';
import Link from '@components/ui/Link';
import Text from '@components/ui/Text';

const Simulators = ({
  textTitle,
  simulatorTitle,
  simulatorResultColor,
  simulatorResultBackgroundColor,
  simulatorBackgroundColor,
  simulatorDisclaimerLegacyColor,
}: {
  textTitle?: string;
  simulatorTitle?: string;
  simulatorResultColor?: string;
  simulatorResultBackgroundColor?: string;
  simulatorBackgroundColor?: string;
  simulatorDisclaimerLegacyColor?: LegacyColor;
}) => {
  return (
    <Box className="fr-container">
      <ResponsiveRow>
        <Box flex>
          <Heading as="h4" legacyColor="white">
            {textTitle}
          </Heading>
          <Box>
            <WhiteArrowPuce>
              <Text>
                Le coup de pouce <strong>«&nbsp;Chauffage des bâtiments résidentiels collectifs ettertiaires&nbsp;»</strong> permet
                d’obtenir des aides financières conséquentes pour se raccorder.
              </Text>
            </WhiteArrowPuce>
            <WhiteArrowPuce>
              <Text>
                <strong style={{ backgroundColor: '#F8D86E', color: '#000091' }}>
                  Le coût du raccordement peut ainsi être réduit à quelques centaines d’euros par logement
                </strong>{' '}
                (en fonction de la situation du bâtiment et de ses besoins en chaleur).
              </Text>
            </WhiteArrowPuce>
            <WhiteArrowPuce>
              <Text>
                Différentes entreprises signataires de la charte « Chauffage des bâtiments résidentiels collectifs et tertiaires » offrent
                cette prime. <br />
                <strong>
                  Le montant de la prime peut significativement varier d’une entreprise à l’autre, il est donc important de comparer les
                  offres proposées.
                </strong>
              </Text>
            </WhiteArrowPuce>
          </Box>
          <Box ml="4w" mt="1w">
            <Link href="/ressources/aides#contenu" variant="primary">
              Tout savoir sur cette aide
            </Link>
          </Box>
        </Box>
        <Box flex maxWidth="40%">
          {simulatorTitle && (
            <Heading as="h4" legacyColor="white">
              {simulatorTitle}
            </Heading>
          )}
          <Simulator
            resultColor={simulatorResultColor}
            resultBackgroundColor={simulatorResultBackgroundColor}
            backgroundColor={simulatorBackgroundColor}
            disclaimerLegacyColor={simulatorDisclaimerLegacyColor}
            cartridge
          ></Simulator>
        </Box>
      </ResponsiveRow>
    </Box>
  );
};

export default Simulators;
