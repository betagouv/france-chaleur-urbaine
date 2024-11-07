import { Button } from '@codegouvfr/react-dsfr/Button';
import { useMemo } from 'react';

import { batimentsRaccordesLayerMaxOpacity } from '@components/Map/map-layers';
import useFCUMap from '@components/Map/MapProvider';
import ReseauxDeChaleurFilters from '@components/ReseauxDeChaleurFilters';
import Box from '@components/ui/Box';
import Divider from '@components/ui/Divider';
import Icon from '@components/ui/Icon';
import Link from '@components/ui/Link';
import Text from '@components/ui/Text';
import Tooltip from '@components/ui/Tooltip';
import { themeDefHeatNetwork, themeDefZoneDP } from 'src/services/Map/businessRules';

import { LegendFilters, SingleCheckbox, TabScrollablePart, Title } from './SimpleMapLegend.style';

export const mapLegendFeatures = [
  'reseauxDeChaleur',
  'reseauxDeFroid',
  'reseauxEnConstruction',
  'zonesDeDeveloppementPrioritaire',
  'batimentsRaccordesReseauxChaleur',
  'batimentsRaccordesReseauxFroid',
] as const;

export type MapLegendFeature = (typeof mapLegendFeatures)[number];

// TODO thos should be fine tuned to decouple more the map configuration from the legend
// but for now it's enough
interface SimpleMapLegendProps {
  enabledFeatures?: MapLegendFeature[];
  legendTitle?: string;
  filtersVisible: boolean;
  setFiltersVisible: (visible: boolean) => void;
  isIframeContext?: boolean;
}

const MapLegendReseaux: React.FC<SimpleMapLegendProps> = ({
  filtersVisible,
  setFiltersVisible,
  legendTitle,
  isIframeContext,
  ...props
}) => {
  const { mapConfiguration, toggleLayer, countFilters } = useFCUMap();
  const nbFilters = countFilters('reseauxDeChaleur');

  const enabledFeatures = useMemo(() => {
    return props.enabledFeatures ?? mapLegendFeatures;
  }, [props.enabledFeatures]);

  if (filtersVisible) {
    return (
      <LegendFilters>
        <Button
          onClick={() => setFiltersVisible(false)}
          priority="secondary"
          size="small"
          iconId="fr-icon-arrow-left-line"
          className="fr-mb-2w"
          style={{ position: 'sticky', top: '0', background: 'white' }}
        >
          Retour
        </Button>
        <TabScrollablePart>
          <Title>Filtres{nbFilters > 0 ? ` (${nbFilters})` : ''}</Title>
          <Text fontSize="13px" lineHeight="18px" mb="2w">
            Filtre uniquement sur les réseaux de chaleur existants, pour lesquels les données sont disponibles.
          </Text>
          <ReseauxDeChaleurFilters linkTo="list" />
        </TabScrollablePart>
      </LegendFilters>
    );
  }

  return (
    <Box mt="2v" px="1w" style={{ overflow: 'auto' }}>
      <Title>{legendTitle || 'Réseaux de chaleur et de froid'}</Title>
      <Text fontSize="13px" lineHeight="18px" mb="2w">
        Cliquez sur un réseau pour connaître ses caractéristiques
      </Text>

      {enabledFeatures.includes('reseauxDeChaleur') && (
        <>
          <Box display="flex" mb="2w">
            <SingleCheckbox
              name="reseauxDeChaleur"
              checked={mapConfiguration.reseauxDeChaleur.show}
              onChange={() => toggleLayer('reseauxDeChaleur.show')}
              trackingEvent="Carto|Réseaux chaleur"
            />

            <Box flex>
              <Box display="flex">
                <Box backgroundColor={themeDefHeatNetwork.classed.color} height="8px" minWidth="25px" borderRadius="4px" mt="1w" />

                <Text as="label" htmlFor="reseauxDeChaleur" fontSize="14px" lineHeight="18px" cursor="pointer" pt="1v" px="1v">
                  Réseaux de chaleur classés
                </Text>
              </Box>

              <Box display="flex">
                <Box backgroundColor={themeDefHeatNetwork.outline.color} height="8px" minWidth="25px" borderRadius="4px" mt="1w" />

                <Box px="1v">
                  <Text as="label" htmlFor="reseauxDeChaleur" fontSize="14px" lineHeight="18px" cursor="pointer">
                    Réseaux de chaleur non classés
                  </Text>

                  <Text fontSize="12px" lineHeight="14px" color="grey">
                    (tracé ou cercle au centre de la commune si tracé non disponible)
                  </Text>
                </Box>
              </Box>
            </Box>

            <Tooltip
              title={
                <>
                  Pour les réseaux classés, le raccordement des bâtiments neufs ou renouvelant leur installation de chauffage au-dessus
                  d'une certaine puissance est obligatoire dès lors qu'ils sont situés dans le périmètre de développement prioritaire (sauf
                  dérogation).
                  <br />
                  Les réseaux affichés comme classés sont ceux listés par arrêté du 22 décembre 2023. Collectivités : pour signaler un
                  dé-classement, cliquez sur Contribuer.
                </>
              }
              iconProps={{
                color: 'var(--text-action-high-blue-france)',
              }}
            />
          </Box>
          {!isIframeContext && (
            <Button
              onClick={() => setFiltersVisible(true)}
              priority="tertiary"
              className="fr-mb-2w fr-ml-3w"
              iconId="ri-filter-line"
              size="small"
              disabled={!mapConfiguration.reseauxDeChaleur.show}
            >
              Tous les filtres ({nbFilters})
            </Button>
          )}
        </>
      )}

      {enabledFeatures.includes('zonesDeDeveloppementPrioritaire') && (
        <Box display="flex" mb="2w">
          <SingleCheckbox
            name="zonesDeDeveloppementPrioritaire"
            checked={mapConfiguration.zonesDeDeveloppementPrioritaire}
            onChange={() => toggleLayer('zonesDeDeveloppementPrioritaire')}
            trackingEvent="Carto|Périmètres de développement prioritaire"
          />

          <Box backgroundColor={themeDefZoneDP.fill.color} opacity={themeDefZoneDP.fill.opacity} height="16px" minWidth="25px" mt="1v" />

          <Text
            as="label"
            htmlFor="zonesDeDeveloppementPrioritaire"
            fontSize="14px"
            lineHeight="18px"
            className="fr-col"
            cursor="pointer"
            pt="1v"
            px="1v"
          >
            Périmètres de développement prioritaire des réseaux classés
          </Text>

          <Tooltip
            title={
              <>
                Dans cette zone, le raccordement des nouvelles constructions ou des bâtiments renouvelant leur installation de chauffage
                au-dessus d'une certaine puissance est obligatoire.
              </>
            }
            iconProps={{
              color: 'var(--text-action-high-blue-france)',
            }}
          />
        </Box>
      )}

      {enabledFeatures.includes('reseauxEnConstruction') && (
        <Box display="flex" mb="2w">
          <SingleCheckbox
            name="reseauxEnConstruction"
            checked={mapConfiguration.reseauxEnConstruction}
            onChange={() => toggleLayer('reseauxEnConstruction')}
            trackingEvent="Carto|Réseaux en construction"
          />

          <Box flex>
            <Box display="flex">
              <Box>
                <Box backgroundColor={themeDefHeatNetwork.futur.color} height="8px" minWidth="25px" borderRadius="4px" mt="1w" />

                <Box
                  backgroundColor={themeDefHeatNetwork.futur.color}
                  opacity={themeDefHeatNetwork.futur.opacity}
                  height="16px"
                  minWidth="25px"
                  mt="1w"
                />
              </Box>

              <Box flex px="1v">
                <Text
                  as="label"
                  htmlFor="reseauxEnConstruction"
                  display="inline-block"
                  fontSize="14px"
                  lineHeight="18px"
                  cursor="pointer"
                  pt="1v"
                >
                  Réseaux de chaleur en construction
                </Text>

                <Text fontSize="12px" lineHeight="14px" color="grey">
                  (tracé ou zone si tracé non disponible)
                </Text>
              </Box>
            </Box>
          </Box>

          <Tooltip
            title={<>Projets financés par l'ADEME ou signalés par les collectivités et exploitants.</>}
            iconProps={{
              color: 'var(--text-action-high-blue-france)',
            }}
          />
        </Box>
      )}

      {enabledFeatures.includes('batimentsRaccordesReseauxChaleur') && (
        <>
          <Box display="flex">
            <SingleCheckbox
              name="batimentsRaccordesReseauxChaleur"
              checked={mapConfiguration.batimentsRaccordesReseauxChaleur}
              onChange={() => toggleLayer('batimentsRaccordesReseauxChaleur')}
              trackingEvent="Carto|Bâtiments raccordés réseau chaleur"
            />

            <Box
              backgroundColor={themeDefHeatNetwork.classed.color}
              opacity={batimentsRaccordesLayerMaxOpacity}
              height="16px"
              width="16px"
              mt="1v"
              mr="3v"
            />

            <Text
              as="label"
              htmlFor="batimentsRaccordesReseauxChaleur"
              fontSize="14px"
              lineHeight="18px"
              className="fr-col"
              cursor="pointer"
              style={{ marginTop: '2px' }}
            >
              Bâtiments raccordés à un réseau de chaleur
            </Text>
          </Box>
        </>
      )}

      {enabledFeatures.includes('reseauxDeFroid') && (
        <>
          <Divider />
          <Box display="flex" mb="2w">
            <SingleCheckbox
              name="reseauxDeFroid"
              checked={mapConfiguration.reseauxDeFroid}
              onChange={() => toggleLayer('reseauxDeFroid')}
              trackingEvent="Carto|Réseaux de froid"
            />

            <Box backgroundColor={themeDefHeatNetwork.cold.color} height="8px" minWidth="25px" borderRadius="4px" mt="1w" />

            <Box flex px="1v">
              <Text as="label" htmlFor="reseauxDeFroid" fontSize="14px" lineHeight="18px" cursor="pointer">
                Réseaux de froid
              </Text>
              <Text fontSize="12px" lineHeight="14px" color="grey">
                (tracé ou cercle au centre de la commune si tracé non disponible)
              </Text>
            </Box>
          </Box>
        </>
      )}
      {enabledFeatures.includes('batimentsRaccordesReseauxFroid') && (
        <>
          <Box display="flex">
            <SingleCheckbox
              name="batimentsRaccordesReseauxFroid"
              checked={mapConfiguration.batimentsRaccordesReseauxFroid}
              onChange={() => toggleLayer('batimentsRaccordesReseauxFroid')}
              trackingEvent="Carto|Bâtiments raccordés réseau froid"
            />

            <Box
              backgroundColor={themeDefHeatNetwork.cold.color}
              opacity={batimentsRaccordesLayerMaxOpacity}
              height="16px"
              width="16px"
              mt="1v"
              mr="3v"
            />

            <Text
              as="label"
              htmlFor="batimentsRaccordesReseauxFroid"
              fontSize="14px"
              lineHeight="18px"
              className="fr-col"
              cursor="pointer"
              style={{ marginTop: '2px' }}
            >
              Bâtiments raccordés à un réseau de froid
            </Text>
          </Box>
        </>
      )}
      {!isIframeContext && (
        <Box mt="4w" display="flex" flexDirection="column" alignItems="stretch" justifyContent="center" gap="8px">
          <Link
            variant="primary"
            href="/contribution"
            className="fr-btn--tertiary d-flex"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <Icon name="fr-icon-heart-line" size="sm" mr="1v" />
            Contribuer
          </Link>

          <Link
            isExternal
            variant="primary"
            href="https://www.data.gouv.fr/fr/datasets/traces-des-reseaux-de-chaleur-et-de-froid/"
            eventKey="Téléchargement|Tracés|carte"
            className="fr-btn--tertiary d-flex"
            mx="auto"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Télécharger les tracés
          </Link>
        </Box>
      )}
    </Box>
  );
};

export default MapLegendReseaux;
