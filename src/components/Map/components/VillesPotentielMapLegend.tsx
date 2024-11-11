import Checkbox from '@components/form/dsfr/Checkbox';
import { besoinsEnChaleurIntervals } from '@components/Map/map-layers';
import useFCUMap from '@components/Map/MapProvider';
import Box from '@components/ui/Box';
import Link from '@components/ui/Link';
import Text from '@components/ui/Text';
import { themeDefZonePotentielChaud, themeDefZonePotentielFortChaud } from 'src/services/Map/businessRules/zonePotentielChaud';

import IconPolygon from './IconPolygon';
import { Title } from './SimpleMapLegend.style';

function VillesPotentielMapLegend() {
  const { mapConfiguration, toggleLayer } = useFCUMap();

  return (
    <Box mt="2w" px="2w" style={{ overflow: 'auto' }}>
      <Title>Légende</Title>
      <Checkbox
        className="fr-mt-4w"
        small
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
                <Text
                  as="label"
                  htmlFor="besoinsEnChaleur"
                  fontSize="14px"
                  lineHeight="18px"
                  className="fr-col"
                  fontWeight="bold"
                  cursor="pointer"
                  pt="1v"
                  px="1v"
                >
                  Besoins en chaleur
                </Text>
              </Box>
            ),
            nativeInputProps: {
              name: 'besoinsEnChaleur',
              checked: mapConfiguration.besoinsEnChaleur,
              onChange: () => toggleLayer('besoinsEnChaleur'),
            },
          },
          {
            label: (
              <Box display="flex" gap="4px" alignItems="center">
                <IconPolygon stroke={themeDefZonePotentielFortChaud.fill.color} fillOpacity={themeDefZonePotentielFortChaud.fill.opacity} />

                <Text
                  as="label"
                  htmlFor="zonesPotentielFortChaud"
                  fontSize="14px"
                  lineHeight="18px"
                  className="fr-col"
                  fontWeight="bold"
                  cursor="pointer"
                  pt="1v"
                  px="1v"
                >
                  Zones à fort potentiel
                </Text>
              </Box>
            ),
            nativeInputProps: {
              name: 'zonesPotentielFortChaud',
              checked: mapConfiguration.zonesOpportunite.zonesPotentielFortChaud,
              onChange: () => toggleLayer('zonesOpportunite.zonesPotentielFortChaud'),
            },
          },
          {
            label: (
              <Box display="flex" gap="4px" alignItems="center">
                <IconPolygon stroke={themeDefZonePotentielChaud.fill.color} fillOpacity={themeDefZonePotentielChaud.fill.opacity} />
                <Text
                  as="label"
                  htmlFor="zonesPotentielChaud"
                  fontSize="14px"
                  lineHeight="18px"
                  className="fr-col"
                  fontWeight="bold"
                  cursor="pointer"
                  pt="1v"
                  px="1v"
                >
                  Zones à potentiel
                </Text>
              </Box>
            ),
            nativeInputProps: {
              name: 'zonesPotentielChaud',
              checked: mapConfiguration.zonesOpportunite.zonesPotentielChaud,
              onChange: () => toggleLayer('zonesOpportunite.zonesPotentielChaud'),
            },
          },
        ]}
      />
      <Box fontSize={'10px'} textAlign="right" mt="2w">
        <Link href="https://reseaux-chaleur.cerema.fr/cartographie-nationale-besoins-chaleur-froid" isExternal>
          Source: Cerema, projet EnRezo.
        </Link>
      </Box>
    </Box>
  );
}

export default VillesPotentielMapLegend;
