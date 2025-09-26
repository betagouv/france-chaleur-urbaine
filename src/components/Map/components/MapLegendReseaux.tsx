import { Button } from '@codegouvfr/react-dsfr/Button';
import { useMemo } from 'react';

import { customGeojsonColor, customGeojsonOpacity } from '@/components/Map/layers/customGeojson';
import { geomUpdateColor, geomUpdateOpacity } from '@/components/Map/layers/geomUpdate';
import { type MapLegendFeature, mapLegendFeatures } from '@/components/Map/map-layers';
import useFCUMap from '@/components/Map/MapProvider';
import ReseauxDeChaleurFilters from '@/components/ReseauxDeChaleurFilters';
import Box from '@/components/ui/Box';
import CallOut from '@/components/ui/CallOut';
import Divider from '@/components/ui/Divider';
import Icon from '@/components/ui/Icon';
import Link from '@/components/ui/Link';
import Text from '@/components/ui/Text';
import Tooltip from '@/components/ui/Tooltip';
import { useAuthentication } from '@/modules/auth/client/hooks';

import { LegendFilters, SingleCheckbox, TabScrollablePart, Title } from './SimpleMapLegend.style';
import {
  batimentsRaccordesReseauxChaleurFroidOpacity,
  batimentsRaccordesReseauxDeChaleurColor,
  batimentsRaccordesReseauxDeFroidColor,
} from '../layers/batimentsRaccordesReseauxChaleurFroid';
import {
  perimetresDeDeveloppementPrioritaireColor,
  perimetresDeDeveloppementPrioritaireOpacity,
} from '../layers/perimetresDeDeveloppementPrioritaire';
import { reseauDeChaleurClasseColor, reseauDeChaleurNonClasseColor } from '../layers/reseauxDeChaleur';
import { reseauxDeFroidColor } from '../layers/reseauxDeFroid';
import { reseauxEnConstructionColor, reseauxEnConstructionOpacity } from '../layers/reseauxEnConstruction';

// TODO thos should be fine tuned to decouple more the map configuration from the legend
// but for now it's enough
interface SimpleMapLegendProps {
  enabledFeatures?: MapLegendFeature[];
  legendTitle?: string;
  showFilters?: boolean;
  filtersVisible: boolean;
  setFiltersVisible: (visible: boolean) => void;
  isIframeContext?: boolean;
  withComptePro?: boolean;
  showHeader?: boolean;
}

const MapLegendReseaux: React.FC<SimpleMapLegendProps> = ({
  filtersVisible,
  setFiltersVisible,
  legendTitle,
  isIframeContext,
  withComptePro,
  showFilters = true,
  showHeader = true,
  ...props
}) => {
  const { mapConfiguration, toggleLayer, nbFilters } = useFCUMap();
  const { hasRole } = useAuthentication();

  const enabledFeatures = useMemo(() => {
    return props.enabledFeatures ?? mapLegendFeatures;
  }, [props.enabledFeatures]);

  if (filtersVisible && showFilters) {
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
      {showHeader && (
        <>
          <Title>{legendTitle || 'Réseaux de chaleur et de froid'}</Title>
          <Text fontSize="13px" lineHeight="18px" mb="2w">
            Cliquez sur un réseau pour connaître ses caractéristiques
          </Text>
        </>
      )}

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
                <Box backgroundColor={reseauDeChaleurClasseColor} height="8px" minWidth="25px" borderRadius="4px" mt="1w" />

                <Text as="label" htmlFor="reseauxDeChaleur" fontSize="14px" lineHeight="18px" cursor="pointer" pt="1v" px="1v">
                  Réseaux de chaleur classés
                </Text>
              </Box>

              <Box display="flex">
                <Box backgroundColor={reseauDeChaleurNonClasseColor} height="8px" minWidth="25px" borderRadius="4px" mt="1w" />

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
          {!isIframeContext && showFilters && (
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

          <Box
            backgroundColor={perimetresDeDeveloppementPrioritaireColor}
            opacity={perimetresDeDeveloppementPrioritaireOpacity}
            height="16px"
            minWidth="25px"
            mt="1v"
          />

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
                <Box backgroundColor={reseauxEnConstructionColor} height="8px" minWidth="25px" borderRadius="4px" mt="1w" />

                <Box
                  backgroundColor={reseauxEnConstructionColor}
                  opacity={reseauxEnConstructionOpacity}
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
              backgroundColor={batimentsRaccordesReseauxDeChaleurColor}
              opacity={batimentsRaccordesReseauxChaleurFroidOpacity}
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

            <Box backgroundColor={reseauxDeFroidColor} height="8px" minWidth="25px" borderRadius="4px" mt="1w" />

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
              backgroundColor={batimentsRaccordesReseauxDeFroidColor}
              opacity={batimentsRaccordesReseauxChaleurFroidOpacity}
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

      {hasRole('admin') && (
        <div className="my-2">
          <Title className="mb-1">Admin</Title>
          <Box display="flex">
            <SingleCheckbox name="customGeojson" checked={mapConfiguration.customGeojson} onChange={() => toggleLayer('customGeojson')} />

            <Box backgroundColor={customGeojsonColor} opacity={customGeojsonOpacity} height="16px" width="16px" mt="1v" mr="3v" />

            <Text
              as="label"
              htmlFor="customGeojson"
              fontSize="14px"
              lineHeight="18px"
              className="fr-col"
              cursor="pointer"
              style={{ marginTop: '2px' }}
            >
              Fichier déposé sur la carte
            </Text>
          </Box>
          <Box display="flex">
            <SingleCheckbox name="geomUpdate" checked={mapConfiguration.geomUpdate} onChange={() => toggleLayer('geomUpdate')} />

            <Box backgroundColor={geomUpdateColor} opacity={geomUpdateOpacity} height="16px" width="16px" mt="1v" mr="3v" />

            <Text
              as="label"
              htmlFor="geomUpdate"
              fontSize="14px"
              lineHeight="18px"
              className="fr-col"
              cursor="pointer"
              style={{ marginTop: '2px' }}
            >
              Géométrie modifiée
            </Text>
          </Box>
        </div>
      )}
      {withComptePro && (
        <>
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
          <CallOut title="Vous êtes professionnel ?" variant="info" size="md" className="mt-5!" image="/icons/picto-compte-pro.svg">
            <ul>
              <li>Retrouvez vos listes d’adresses</li>
              <li>Comparez les coûts et les émissions de CO2</li>
            </ul>
            <Link href="/inscription" className="fr-btn fr-btn--primary">
              Créer un compte
            </Link>
          </CallOut>
        </>
      )}
    </Box>
  );
};

export default MapLegendReseaux;
