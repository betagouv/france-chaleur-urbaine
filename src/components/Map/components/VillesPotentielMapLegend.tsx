import { useToggle } from '@react-hookz/web';
import styled from 'styled-components';

import Checkboxes from '@/components/form/dsfr/Checkboxes';
import useFCUMap from '@/components/Map/MapProvider';
import Accordion from '@/components/ui/Accordion';
import Box, { type BoxProps } from '@/components/ui/Box';
import Text from '@/components/ui/Text';

import { besoinsEnChaleurIntervals } from '../layers/besoinsEnChaleur';
import { zonePotentielChaudColor, zonePotentielChaudOpacity, zonePotentielFortChaudColor } from '../layers/zonesPotentielChaud';
import IconPolygon from './IconPolygon';

const StyledBox = styled(Box)`
  .fr-fieldset {
    margin-right: 0 !important; // surcharge le margin négatif inutile du dsfr
  }

  ${({ theme }) => theme.media.lg`
    min-width: 240px;
    margin-left: 0.5rem;
    margin-top: 0.5rem;
    position: absolute;
    z-index: 1;
    background-color: white;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
`}
`;

function VillesPotentielMapLegend(props?: BoxProps) {
  const { mapConfiguration, toggleLayer } = useFCUMap();
  const [legendShown, toggleLegend] = useToggle(true);

  return (
    <StyledBox {...props}>
      <Accordion small label="Légende" onExpandedChange={toggleLegend} expanded={legendShown} style={{ paddingBottom: '0' }}>
        <Checkboxes
          small
          className="fr-mt-1w fr-ml-1v"
          options={[
            {
              label: (
                <Box display="flex" gap="4px" alignItems="center">
                  <IconPolygon
                    stroke={
                      besoinsEnChaleurIntervals[
                        besoinsEnChaleurIntervals.length - 3 // lighter color
                      ].color
                    }
                    fillOpacity={0.7}
                  />
                  <Text fontSize="14px" lineHeight="18px" className="fr-col" cursor="pointer" pt="1v" px="1v">
                    Besoins en chaleur
                  </Text>
                </Box>
              ),
              nativeInputProps: {
                checked: mapConfiguration.besoinsEnChaleur,
                name: 'besoinsEnChaleur',
                onChange: () => toggleLayer('besoinsEnChaleur'),
              },
            },
            {
              label: (
                <Box display="flex" gap="4px" alignItems="center">
                  <IconPolygon stroke={zonePotentielFortChaudColor} fillOpacity={zonePotentielChaudOpacity} />

                  <Text fontSize="14px" lineHeight="18px" className="fr-col" cursor="pointer" pt="1v" px="1v">
                    Zones à fort potentiel
                  </Text>
                </Box>
              ),
              nativeInputProps: {
                checked: mapConfiguration.zonesOpportunite.zonesPotentielFortChaud,
                name: 'zonesPotentielFortChaud',
                onChange: () => toggleLayer('zonesOpportunite.zonesPotentielFortChaud'),
              },
            },
            {
              label: (
                <Box display="flex" gap="4px" alignItems="center">
                  <IconPolygon stroke={zonePotentielChaudColor} fillOpacity={zonePotentielChaudOpacity} />
                  <Text fontSize="14px" lineHeight="18px" className="fr-col" cursor="pointer" pt="1v" px="1v">
                    Zones à potentiel
                  </Text>
                </Box>
              ),
              nativeInputProps: {
                checked: mapConfiguration.zonesOpportunite.zonesPotentielChaud,
                name: 'zonesPotentielChaud',
                onChange: () => toggleLayer('zonesOpportunite.zonesPotentielChaud'),
              },
            },
          ]}
        />
      </Accordion>
    </StyledBox>
  );
}

export default VillesPotentielMapLegend;
