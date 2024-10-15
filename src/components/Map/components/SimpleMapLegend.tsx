import Button from '@codegouvfr/react-dsfr/Button';
import Image from 'next/image';
import { useQueryState } from 'nuqs';

import {
  LegendDeskData,
  besoinsEnChaleurIndustrieCommunesIntervals,
  besoinsEnChaleurIntervals,
  besoinsEnFroidIntervals,
  energyLayerMaxOpacity,
} from '@components/Map/map-layers';
import { UrlStateAccordion } from '@components/ui/Accordion';
import Box from '@components/ui/Box';
import Link from '@components/ui/Link';
import Text from '@components/ui/Text';
import Tooltip from '@components/ui/Tooltip';
import { trackEvent } from 'src/services/analytics';
import { themeDefBuildings, themeDefDemands, themeDefEnergy, themeDefTypeGas } from 'src/services/Map/businessRules';
import { themeDefSolaireThermiqueFriches, themeDefSolaireThermiqueParkings } from 'src/services/Map/businessRules/enrrMobilisables';
import { themeDefZonePotentielChaud, themeDefZonePotentielFortChaud } from 'src/services/Map/businessRules/zonePotentielChaud';
import { communesFortPotentielPourCreationReseauxChaleurInterval, defaultMapConfiguration } from 'src/services/Map/map-configuration';

import DevModeIcon from './DevModeIcon';
import IconPolygon from './IconPolygon';
import MapLegendReseaux, { type MapLegendFeature } from './MapLegendReseaux';
import ModalCarteFrance from './ModalCarteFrance';
import RangeFilter from './RangeFilter';
import ScaleLegend from './ScaleLegend';
import {
  DeactivatableBox,
  SingleCheckbox,
  TabId,
  TabObject,
  Tabs,
  Title,
  TrackableCheckableAccordion,
  parseURLTabs,
  tabs,
} from './SimpleMapLegend.style';
import BuildingsDataExtractionTool from './tools/BuildingsDataExtractionTool';
import DistancesMeasurementTool from './tools/DistancesMeasurementTool';
import LinearHeatDensityTool from './tools/LinearHeatDensityTool';
import {
  communesFortPotentielPourCreationReseauxChaleurLayerColor,
  communesFortPotentielPourCreationReseauxChaleurLayerOpacity,
} from '../map-styles';
import useFCUMap from '../MapProvider';

const consommationsGazLegendColor = '#D9D9D9';
const consommationsGazUsageLegendOpacity = 0.53;

interface SimpleMapLegendProps {
  enabledFeatures?: MapLegendFeature[];
  legendTitle?: string;
}

const defaultURL: TabObject = { tabId: 'reseaux', subTabId: null };

function SimpleMapLegend({ legendTitle, enabledFeatures }: SimpleMapLegendProps) {
  const [selectedTabId, setSelectedTabId] = useQueryState<TabObject>(
    'tabId',
    parseURLTabs(tabs).withDefault(defaultURL).withOptions({
      history: 'push',
    })
  );
  const { mapConfiguration, toggleLayer, updateScaleInterval } = useFCUMap();
  const setReseauxFiltersVisible = (visible: boolean) => setSelectedTabId({ tabId: 'reseaux', subTabId: visible ? 'filtres' : null });

  const nbCouchesFondBatiments =
    (mapConfiguration.caracteristiquesBatiments ? 1 : 0) +
    (mapConfiguration.besoinsEnChaleur ? 1 : 0) +
    (mapConfiguration.besoinsEnFroid ? 1 : 0);

  if (enabledFeatures) {
    // This is an iframe, don't show tabs
    return (
      <MapLegendReseaux
        enabledFeatures={enabledFeatures}
        legendTitle={legendTitle}
        filtersVisible={selectedTabId.subTabId === 'filtres'}
        setFiltersVisible={setReseauxFiltersVisible}
      />
    );
  }

  return (
    <Tabs
      selectedTabId={selectedTabId.tabId}
      tabs={tabs}
      onTabChange={(newTabId) => {
        trackEvent(`Carto|Tabs|${newTabId as TabId}`);
        setSelectedTabId({ tabId: newTabId as TabId, subTabId: null });
      }}
    >
      {selectedTabId.tabId === 'reseaux' && (
        <MapLegendReseaux
          enabledFeatures={enabledFeatures}
          legendTitle={legendTitle}
          filtersVisible={selectedTabId.subTabId === 'filtres'}
          setFiltersVisible={setReseauxFiltersVisible}
        />
      )}
      {selectedTabId.tabId === 'potentiel' && (
        <Box mt="2v" mx="1w">
          <Title>Potentiel</Title>
          <Box display="flex" alignItems="start" mb="2w">
            <SingleCheckbox
              name="demandesEligibilite"
              checked={mapConfiguration.demandesEligibilite}
              onChange={() => toggleLayer('demandesEligibilite')}
              trackingEvent="Carto|Demandes de raccordement"
            />

            <Box
              backgroundColor={themeDefDemands.fill.color}
              border={`2px solid ${themeDefDemands.stroke.color}`}
              borderRadius="50%"
              minHeight="16px"
              minWidth="16px"
              mt="1v"
            />

            <Text
              as="label"
              htmlFor="demandesEligibilite"
              fontSize="14px"
              lineHeight="18px"
              className="fr-col"
              cursor="pointer"
              pl="1w"
              style={{ marginTop: '2px' }}
            >
              Demandes de raccordement sur France Chaleur Urbaine
            </Text>
          </Box>
          <UrlStateAccordion label="Bâtiments consommateurs gaz et fioul" small>
            <TrackableCheckableAccordion
              name="consommationsGaz"
              checked={mapConfiguration.consommationsGaz.show}
              layerName="consommationsGaz.show"
              trackingEvent="Carto|Consommations globales de gaz"
              label={
                <>
                  <Box
                    backgroundColor={consommationsGazLegendColor}
                    opacity={consommationsGazUsageLegendOpacity}
                    height="16px"
                    width="16px"
                    borderRadius="50%"
                    mt="1v"
                  />
                  <span>Consommations globales de gaz</span>
                </>
              }
            >
              <DeactivatableBox disabled={!mapConfiguration.consommationsGaz.show}>
                <Box display="flex" flexWrap="wrap" px="1w">
                  <Box display="flex">
                    <SingleCheckbox
                      name="consommationsGazLogements"
                      checked={mapConfiguration.consommationsGaz.logements}
                      onChange={() => toggleLayer('consommationsGaz.logements')}
                    />

                    <Box backgroundColor={themeDefTypeGas.R.color} height="10px" width="10px" borderRadius="50%" mt="2v" />

                    <Text
                      as="label"
                      htmlFor="consommationsGazLogements"
                      fontSize="14px"
                      lineHeight="18px"
                      className="fr-col"
                      fontWeight="bold"
                      cursor="pointer"
                      pt="1v"
                      px="1v"
                    >
                      Logements (tous types)
                    </Text>
                  </Box>

                  <Box display="flex">
                    <SingleCheckbox
                      name="consommationsGazTertiaire"
                      checked={mapConfiguration.consommationsGaz.tertiaire}
                      onChange={() => toggleLayer('consommationsGaz.tertiaire')}
                    />

                    <Box backgroundColor={themeDefTypeGas.T.color} height="10px" width="10px" borderRadius="50%" mt="2v" />

                    <Text
                      as="label"
                      htmlFor="consommationsGazTertiaire"
                      fontSize="14px"
                      lineHeight="18px"
                      className="fr-col"
                      fontWeight="bold"
                      cursor="pointer"
                      pt="1v"
                      px="1v"
                    >
                      Tertiaire
                    </Text>
                  </Box>

                  <Box display="flex">
                    <SingleCheckbox
                      name="consommationsGazIndustrie"
                      checked={mapConfiguration.consommationsGaz.industrie}
                      onChange={() => toggleLayer('consommationsGaz.industrie')}
                    />

                    <Box backgroundColor={themeDefTypeGas.I.color} height="10px" width="10px" borderRadius="50%" mt="2v" />

                    <Text
                      as="label"
                      htmlFor="consommationsGazIndustrie"
                      fontSize="14px"
                      lineHeight="18px"
                      className="fr-col"
                      fontWeight="bold"
                      cursor="pointer"
                      pt="1v"
                      px="1v"
                    >
                      Industrie
                    </Text>
                  </Box>
                </Box>

                <ScaleLegend
                  className="fr-ml-1w fr-mr-1w"
                  circle
                  label="Niveau de consommation de gaz (MWh/an)"
                  color={consommationsGazLegendColor}
                  defaultValues={defaultMapConfiguration.consommationsGaz.interval}
                  domain={[LegendDeskData.gasUsage.min, LegendDeskData.gasUsage.max]}
                  onChange={updateScaleInterval('consommationsGaz.interval')}
                />
              </DeactivatableBox>
            </TrackableCheckableAccordion>
            <TrackableCheckableAccordion
              name="batimentsGazCollectif"
              layerName="batimentsGazCollectif.show"
              checked={mapConfiguration.batimentsGazCollectif.show}
              trackingEvent="Carto|Bâtiments au gaz collectif"
              label={
                <>
                  <Box backgroundColor={themeDefEnergy.gas.color} opacity={energyLayerMaxOpacity} height="16px" width="16px" mt="1v" />
                  <span>Bâtiments chauffés au gaz collectif</span>
                </>
              }
            >
              <DeactivatableBox disabled={!mapConfiguration.batimentsGazCollectif.show}>
                <ScaleLegend
                  className="fr-ml-1w fr-mr-1w"
                  label="Nombre de lots d'habitation"
                  color={themeDefEnergy.gas.color}
                  domain={[LegendDeskData.energy.min, LegendDeskData.energy.max]}
                  defaultValues={defaultMapConfiguration.batimentsGazCollectif.interval}
                  onChange={updateScaleInterval('batimentsGazCollectif.interval')}
                />
              </DeactivatableBox>
            </TrackableCheckableAccordion>
            <TrackableCheckableAccordion
              name="batimentsFioulCollectif"
              checked={mapConfiguration.batimentsFioulCollectif.show}
              layerName="batimentsFioulCollectif.show"
              trackingEvent="Carto|Bâtiments au fioul collectif"
              label={
                <>
                  <Box backgroundColor={themeDefEnergy.fuelOil.color} opacity={energyLayerMaxOpacity} height="16px" width="16px" mt="1v" />
                  <span>Bâtiments chauffés au fioul collectif</span>
                </>
              }
            >
              <DeactivatableBox disabled={!mapConfiguration.batimentsFioulCollectif.show}>
                <ScaleLegend
                  className="fr-ml-1w fr-mr-1w"
                  label="Nombre de lots d'habitation"
                  color={themeDefEnergy.fuelOil.color}
                  domain={[LegendDeskData.energy.min, LegendDeskData.energy.max]}
                  defaultValues={defaultMapConfiguration.batimentsFioulCollectif.interval}
                  onChange={updateScaleInterval('batimentsFioulCollectif.interval')}
                />
              </DeactivatableBox>
            </TrackableCheckableAccordion>
          </UrlStateAccordion>
          <UrlStateAccordion label="Caractéristiques des bâtiments et besoins en chaleur et en froid" small>
            <>
              <TrackableCheckableAccordion
                name="besoinsEnChaleur"
                checked={mapConfiguration.besoinsEnChaleur}
                layerName="besoinsEnChaleur"
                trackingEvent="Carto|Besoins en chaleur"
                label={
                  <>
                    <IconPolygon
                      stroke={
                        besoinsEnChaleurIntervals[
                          besoinsEnChaleurIntervals.length - 3 // lighter color
                        ].color
                      }
                      fillOpacity={0.7}
                      mt="1v"
                    />
                    <Box flex>Besoins en chaleur</Box>
                    <Tooltip
                      title={
                        <>
                          Modélisation réalisée par le Cerema dans le cadre du projet EnRezo.
                          <br />
                          <Link href="https://reseaux-chaleur.cerema.fr/cartographie-nationale-besoins-chaleur-froid" isExternal>
                            Accéder à la méthodologie
                          </Link>
                        </>
                      }
                    />
                  </>
                }
              >
                <DeactivatableBox disabled={!mapConfiguration.besoinsEnChaleur} mx="1w">
                  <Box display="flex" border="1px solid #777" my="1w">
                    {besoinsEnChaleurIntervals.map((interval, index) => (
                      <Box
                        key={index}
                        height="10px"
                        flex
                        cursor="help"
                        backgroundColor={interval.color}
                        title={`${interval.min} - ${interval.max}`}
                      />
                    ))}
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Text size="xs">{besoinsEnChaleurIntervals[0].min}</Text>
                    <Text size="xs">{besoinsEnChaleurIntervals[besoinsEnChaleurIntervals.length - 1].max}</Text>
                  </Box>
                </DeactivatableBox>
              </TrackableCheckableAccordion>

              {mapConfiguration.besoinsEnChaleur && nbCouchesFondBatiments >= 2 && (
                <Text color="error" size="xs" m="1w">
                  Les caractéristiques des bâtiments et besoins en chaleur et froid ne peuvent être affichés simultanément.
                </Text>
              )}
            </>
            <>
              <TrackableCheckableAccordion
                name="besoinsEnFroid"
                checked={mapConfiguration.besoinsEnFroid}
                layerName="besoinsEnFroid"
                trackingEvent="Carto|Besoins en froid"
                label={
                  <>
                    <IconPolygon
                      stroke={
                        besoinsEnFroidIntervals[
                          besoinsEnFroidIntervals.length - 3 // lighter color
                        ].color
                      }
                      fillOpacity={0.7}
                      mt="1v"
                    />

                    <Box flex>Besoins en froid</Box>
                    <Tooltip
                      title={
                        <>
                          Modélisation réalisée par le Cerema dans le cadre du projet EnRezo.
                          <br />
                          <Link href="https://reseaux-chaleur.cerema.fr/cartographie-nationale-besoins-chaleur-froid" isExternal>
                            Accéder à la méthodologie
                          </Link>
                        </>
                      }
                    />
                  </>
                }
              >
                <DeactivatableBox disabled={!mapConfiguration.besoinsEnFroid} mx="1w">
                  <Box display="flex" border="1px solid #777" my="1w">
                    {besoinsEnFroidIntervals.map((interval, index) => (
                      <Box
                        key={index}
                        height="10px"
                        flex
                        cursor="help"
                        backgroundColor={interval.color}
                        title={`${interval.min} - ${interval.max}`}
                      />
                    ))}
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Text size="xs">{besoinsEnFroidIntervals[0].min}</Text>
                    <Text size="xs">{besoinsEnFroidIntervals[besoinsEnFroidIntervals.length - 1].max}</Text>
                  </Box>
                </DeactivatableBox>
              </TrackableCheckableAccordion>
              {mapConfiguration.besoinsEnFroid && nbCouchesFondBatiments >= 2 && (
                <Text color="error" size="xs" m="1w">
                  Les caractéristiques des bâtiments et besoins en chaleur et froid ne peuvent être affichés simultanément.
                </Text>
              )}
            </>
            <>
              <TrackableCheckableAccordion
                name="caracteristiquesBatiments"
                checked={mapConfiguration.caracteristiquesBatiments}
                layerName="caracteristiquesBatiments"
                trackingEvent="Carto|DPE"
                label={
                  <>
                    <Box
                      backgroundColor={themeDefBuildings.colors.c.color}
                      height="16px"
                      width="16px"
                      mt="1v"
                      display="grid"
                      placeContent="center"
                      fontSize="12px"
                      textColor="white"
                    >
                      C
                    </Box>
                    <Box flex>Caractéristiques des bâtiments</Box>
                    <Tooltip
                      title={
                        <>
                          Les DPE affichés par bâtiment résultent d'un extrapolation des DPE par logement ancienne définition. Ils sont
                          donnés à titre informatif et non-officiel, sans aucune valeur légale.
                        </>
                      }
                    />
                  </>
                }
              >
                <DeactivatableBox disabled={!mapConfiguration.caracteristiquesBatiments} ml="1w" mr="1w">
                  <Text fontSize="13px" lineHeight="18px" fontWeight="lightbold" fontStyle="italic">
                    Cliquer sur le bâtiment souhaité
                  </Text>
                  <Text fontSize="13px">Diagnostic de performance énergétique</Text>
                  <Box display="flex" gap="4px">
                    {Object.entries(themeDefBuildings.colors)
                      .filter(([letter]) => letter.length === 1)
                      .map(([letter, { color }]) => (
                        <Box
                          width="24px"
                          height="24px"
                          fontSize="18px"
                          key={letter}
                          backgroundColor={color}
                          textColor="white"
                          textAlign="center"
                        >
                          {letter.toUpperCase()}
                        </Box>
                      ))}
                  </Box>
                </DeactivatableBox>
              </TrackableCheckableAccordion>
              {mapConfiguration.caracteristiquesBatiments && nbCouchesFondBatiments >= 2 && (
                <Text color="error" size="xs" m="1w">
                  Les caractéristiques des bâtiments et besoins en chaleur et froid ne peuvent être affichés simultanément.
                </Text>
              )}
            </>
          </UrlStateAccordion>
          <UrlStateAccordion label="Potentiel par territoire" small>
            <TrackableCheckableAccordion
              name="zonesOpportunite"
              checked={mapConfiguration.zonesOpportunite.show}
              layerName="zonesOpportunite.show"
              trackingEvent="Carto|Zones d'opportunité"
              label={
                <>
                  <IconPolygon
                    stroke={themeDefZonePotentielFortChaud.fill.color}
                    fillOpacity={themeDefZonePotentielFortChaud.fill.opacity}
                    mt="1v"
                  />
                  <Box flex>Zones d'opportunité pour la création de réseaux de chaleur</Box>
                  <Tooltip
                    title={
                      <>
                        Modélisation réalisée par le Cerema dans le cadre du projet EnRezo.
                        <br />
                        <Link
                          href="https://reseaux-chaleur.cerema.fr/sites/reseaux-chaleur-v2/files/fichiers/2024/01/Methodologie_zones_opportunite_VF.pdf"
                          isExternal
                        >
                          Accéder à la méthodologie
                        </Link>
                      </>
                    }
                  />
                </>
              }
            >
              <DeactivatableBox disabled={!mapConfiguration.zonesOpportunite.show} display="flex" flexWrap="wrap" ml="1w" mr="1w">
                <Box display="flex">
                  <SingleCheckbox
                    name="zonesPotentielChaud"
                    checked={mapConfiguration.zonesOpportunite.zonesPotentielChaud}
                    onChange={() => toggleLayer('zonesOpportunite.zonesPotentielChaud')}
                    trackingEvent="Carto|Zones à potentiel chaud"
                  />

                  <IconPolygon
                    stroke={themeDefZonePotentielChaud.fill.color}
                    fillOpacity={themeDefZonePotentielChaud.fill.opacity}
                    mt="1v"
                  />

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

                <Box display="flex">
                  <SingleCheckbox
                    name="zonesPotentielFortChaud"
                    checked={mapConfiguration.zonesOpportunite.zonesPotentielFortChaud}
                    onChange={() => toggleLayer('zonesOpportunite.zonesPotentielFortChaud')}
                    trackingEvent="Carto|Zones à potentiel fort chaud"
                  />

                  <IconPolygon
                    stroke={themeDefZonePotentielFortChaud.fill.color}
                    fillOpacity={themeDefZonePotentielFortChaud.fill.opacity}
                    mt="1v"
                  />

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
              </DeactivatableBox>
            </TrackableCheckableAccordion>

            <TrackableCheckableAccordion
              name="communesFortPotentielPourCreationReseauxChaleur"
              layerName="communesFortPotentielPourCreationReseauxChaleur.show"
              checked={mapConfiguration.communesFortPotentielPourCreationReseauxChaleur.show}
              trackingEvent="Carto|Communes à fort potentiel pour la création de réseaux de chaleur"
              label={
                <>
                  <Box
                    backgroundColor={communesFortPotentielPourCreationReseauxChaleurLayerColor}
                    opacity={communesFortPotentielPourCreationReseauxChaleurLayerOpacity}
                    borderRadius="50%"
                    minHeight="16px"
                    minWidth="16px"
                    mt="1v"
                  />
                  <Box flex>Communes à fort potentiel pour la création de réseaux de chaleur</Box>
                  <Tooltip
                    title={
                      <>
                        Communes sans réseau de chaleur sur lesquelles au moins une zone d'opportunité à fort potentiel est identifiée par
                        le Cerema dans le cadre du projet EnRezo
                        <br />
                        <Link
                          href="https://reseaux-chaleur.cerema.fr/sites/reseaux-chaleur-v2/files/fichiers/2024/06/methodologie_besoin_industrie_2024.pdf"
                          isExternal
                        >
                          Accéder à la méthodologie
                        </Link>
                      </>
                    }
                  />
                </>
              }
            >
              <DeactivatableBox disabled={!mapConfiguration.communesFortPotentielPourCreationReseauxChaleur.show}>
                <Box mx="3w">
                  <RangeFilter
                    label={<Text size="sm">Nombre d'habitants</Text>}
                    domain={communesFortPotentielPourCreationReseauxChaleurInterval}
                    value={mapConfiguration.communesFortPotentielPourCreationReseauxChaleur.population}
                    onChange={updateScaleInterval('communesFortPotentielPourCreationReseauxChaleur.population')}
                  />
                </Box>
              </DeactivatableBox>
            </TrackableCheckableAccordion>

            <TrackableCheckableAccordion
              name="besoinsEnChaleurIndustrieCommunes"
              checked={mapConfiguration.besoinsEnChaleurIndustrieCommunes}
              layerName="besoinsEnChaleurIndustrieCommunes"
              trackingEvent="Carto|Besoins en chaleur secteur industriel"
              label={
                <>
                  <IconPolygon
                    stroke={besoinsEnChaleurIndustrieCommunesIntervals[besoinsEnChaleurIndustrieCommunesIntervals.length - 1].color}
                    fillOpacity={0.7}
                    mt="1v"
                  />
                  <Box flex>Besoins en chaleur du secteur industriel</Box>
                  <Tooltip
                    title={
                      <>
                        Modélisation réalisée par le Cerema dans le cadre du projet EnRezo.
                        <br />
                        <Link
                          href="https://reseaux-chaleur.cerema.fr/sites/reseaux-chaleur-v2/files/fichiers/2024/06/methodologie_besoin_industrie_2024.pdf"
                          isExternal
                        >
                          Accéder à la méthodologie
                        </Link>
                      </>
                    }
                  />
                </>
              }
            >
              <DeactivatableBox disabled={!mapConfiguration.besoinsEnChaleurIndustrieCommunes} mx="1w">
                <Box display="flex" border="1px solid #777" my="1w">
                  {besoinsEnChaleurIndustrieCommunesIntervals.map((interval, index) => (
                    <Box
                      key={index}
                      height="10px"
                      flex
                      cursor="help"
                      backgroundColor={interval.color}
                      title={`${interval.min} - ${interval.max}`}
                    />
                  ))}
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Text size="xs">{besoinsEnChaleurIndustrieCommunesIntervals[0].min}</Text>
                  <Text size="xs">
                    {besoinsEnChaleurIndustrieCommunesIntervals[besoinsEnChaleurIndustrieCommunesIntervals.length - 1].max}
                  </Text>
                </Box>
              </DeactivatableBox>
            </TrackableCheckableAccordion>
            <Box textAlign="center" mt="1w">
              <ModalCarteFrance />
            </Box>
          </UrlStateAccordion>
        </Box>
      )}
      {selectedTabId.tabId === 'outils' && (
        <Box mt="2v" mx="1w">
          {selectedTabId.subTabId === null ? (
            <Box display="flex" flexDirection="column" gap="16px">
              <Title>Outils</Title>

              <Button
                priority="secondary"
                size="small"
                iconId="ri-ruler-line"
                onClick={() => setSelectedTabId({ tabId: 'outils', subTabId: 'mesure-distance' })}
              >
                Mesurer une distance
              </Button>
              <Button
                priority="secondary"
                size="small"
                iconId="ri-shape-line"
                onClick={() => setSelectedTabId({ tabId: 'outils', subTabId: 'extraire-données-batiment' })}
              >
                Extraire des données sur les bâtiments
              </Button>
              <Button
                priority="secondary"
                size="small"
                iconId="ri-bar-chart-line"
                onClick={() => setSelectedTabId({ tabId: 'outils', subTabId: 'densité-thermique-linéaire' })}
              >
                Calculer une densité thermique linéaire
              </Button>
            </Box>
          ) : (
            <Button
              priority="secondary"
              size="small"
              iconId="fr-icon-arrow-left-line"
              className="fr-mb-2w"
              onClick={() =>
                setSelectedTabId({
                  tabId: 'outils',
                  subTabId: null,
                })
              }
            >
              Retour
            </Button>
          )}
          {selectedTabId.subTabId === 'mesure-distance' && <DistancesMeasurementTool />}
          {selectedTabId.subTabId === 'extraire-données-batiment' && <BuildingsDataExtractionTool />}
          {selectedTabId.subTabId === 'densité-thermique-linéaire' && <LinearHeatDensityTool />}
        </Box>
      )}
      {selectedTabId.tabId === 'enrr' && (
        <Box mt="2v" mx="1w">
          <Title>Énergies renouvelables et de récupération</Title>
          <UrlStateAccordion label="Mobilisables" small>
            <TrackableCheckableAccordion
              name="enrrMobilisablesChaleurFatale"
              checked={mapConfiguration.enrrMobilisablesChaleurFatale.show}
              layerName="enrrMobilisablesChaleurFatale.show"
              trackingEvent="Carto|ENR&R Mobilisables"
              label={
                <>
                  <Box flex>Chaleur fatale</Box>
                  <Tooltip
                    title={
                      <>
                        Données du projet{' '}
                        <Link href="https://reseaux-chaleur.cerema.fr/espace-documentaire/enrezo" isExternal>
                          EnRezo
                        </Link>{' '}
                        du Cerema.
                      </>
                    }
                  />
                </>
              }
            >
              <DeactivatableBox disabled={!mapConfiguration.enrrMobilisablesChaleurFatale.show} ml="1w" mr="1w">
                <Box display="flex">
                  <SingleCheckbox
                    name="showUnitesDIncineration"
                    checked={mapConfiguration.enrrMobilisablesChaleurFatale.showUnitesDIncineration}
                    onChange={() => toggleLayer('enrrMobilisablesChaleurFatale.showUnitesDIncineration')}
                    trackingEvent="Carto|Unités d'incinération"
                  />

                  <Image src="/icons/enrr_mobilisables_unites_incineration.png" alt="" height="16" width="16" className="fr-mt-1v" />

                  <Text
                    as="label"
                    htmlFor="showUnitesDIncineration"
                    fontSize="14px"
                    lineHeight="18px"
                    className="fr-col"
                    fontWeight="bold"
                    cursor="pointer"
                    pt="1v"
                    px="1v"
                  >
                    Unités d’incinération
                  </Text>
                </Box>
                <Box display="flex">
                  <SingleCheckbox
                    name="showIndustrie"
                    checked={mapConfiguration.enrrMobilisablesChaleurFatale.showIndustrie}
                    onChange={() => toggleLayer('enrrMobilisablesChaleurFatale.showIndustrie')}
                    trackingEvent="Carto|Industrie"
                  />

                  <Image src="/icons/enrr_mobilisables_industrie.png" alt="" height="16" width="16" className="fr-mt-1v" />

                  <Text
                    as="label"
                    htmlFor="showIndustrie"
                    fontSize="14px"
                    lineHeight="18px"
                    className="fr-col"
                    fontWeight="bold"
                    cursor="pointer"
                    pt="1v"
                    px="1v"
                  >
                    Industrie
                  </Text>
                </Box>
                <Box display="flex">
                  <SingleCheckbox
                    name="showStationsDEpuration"
                    checked={mapConfiguration.enrrMobilisablesChaleurFatale.showStationsDEpuration}
                    onChange={() => toggleLayer('enrrMobilisablesChaleurFatale.showStationsDEpuration')}
                    trackingEvent="Carto|Stations d'épuration"
                  />

                  <Image src="/icons/enrr_mobilisables_stations_epuration.png" alt="" height="16" width="16" className="fr-mt-1v" />

                  <Text
                    as="label"
                    htmlFor="showStationsDEpuration"
                    fontSize="14px"
                    lineHeight="18px"
                    className="fr-col"
                    fontWeight="bold"
                    cursor="pointer"
                    pt="1v"
                    px="1v"
                  >
                    Stations d'épuration
                  </Text>
                </Box>
                <Box display="flex">
                  <SingleCheckbox
                    name="showDatacenters"
                    checked={mapConfiguration.enrrMobilisablesChaleurFatale.showDatacenters}
                    onChange={() => toggleLayer('enrrMobilisablesChaleurFatale.showDatacenters')}
                    trackingEvent="Carto|Datacenters"
                  />

                  <Image src="/icons/enrr_mobilisables_datacenter.png" alt="" height="16" width="16" className="fr-mt-1v" />

                  <Text
                    as="label"
                    htmlFor="showDatacenters"
                    fontSize="14px"
                    lineHeight="18px"
                    className="fr-col"
                    fontWeight="bold"
                    cursor="pointer"
                    pt="1v"
                    px="1v"
                  >
                    Datacenters
                  </Text>
                </Box>
                <Box display="flex">
                  <SingleCheckbox
                    name="showInstallationsElectrogenes"
                    checked={mapConfiguration.enrrMobilisablesChaleurFatale.showInstallationsElectrogenes}
                    onChange={() => toggleLayer('enrrMobilisablesChaleurFatale.showInstallationsElectrogenes')}
                    trackingEvent="Carto|Installations électrogènes"
                  />

                  <Image src="/icons/enrr_mobilisables_installations_electrogenes.png" alt="" height="16" width="16" className="fr-mt-1v" />

                  <Text
                    as="label"
                    htmlFor="showInstallationsElectrogenes"
                    fontSize="14px"
                    lineHeight="18px"
                    className="fr-col"
                    fontWeight="bold"
                    cursor="pointer"
                    pt="1v"
                    px="1v"
                  >
                    Installations électrogènes
                  </Text>
                </Box>
              </DeactivatableBox>
            </TrackableCheckableAccordion>
            <TrackableCheckableAccordion
              name="enrrMobilisablesSolaireThermique"
              checked={mapConfiguration.enrrMobilisablesSolaireThermique.show}
              layerName="enrrMobilisablesSolaireThermique.show"
              trackingEvent="Carto|ENR&R Mobilisables"
              label={
                <>
                  <Box flex>Solaire thermique</Box>
                  <Tooltip
                    title={
                      <>
                        Données du projet{' '}
                        <Link href="https://reseaux-chaleur.cerema.fr/espace-documentaire/enrezo" isExternal>
                          EnRezo
                        </Link>{' '}
                        du Cerema.
                      </>
                    }
                  />
                </>
              }
            >
              <DeactivatableBox disabled={!mapConfiguration.enrrMobilisablesSolaireThermique.show} ml="1w" mr="1w">
                <Box display="flex">
                  <SingleCheckbox
                    name="friches"
                    checked={mapConfiguration.enrrMobilisablesSolaireThermique.showFriches}
                    onChange={() => toggleLayer('enrrMobilisablesSolaireThermique.showFriches')}
                    trackingEvent="Carto|Solaire thermique - friches"
                  />

                  <IconPolygon
                    stroke={themeDefSolaireThermiqueFriches.color}
                    fillOpacity={themeDefSolaireThermiqueFriches.opacity}
                    mt="1v"
                  />

                  <Text
                    as="label"
                    htmlFor="friches"
                    fontSize="14px"
                    lineHeight="18px"
                    className="fr-col"
                    fontWeight="bold"
                    cursor="pointer"
                    pt="1v"
                    px="1v"
                  >
                    Friches
                  </Text>
                </Box>

                <Box display="flex">
                  <SingleCheckbox
                    name="parkings"
                    checked={mapConfiguration.enrrMobilisablesSolaireThermique.showParkings}
                    onChange={() => toggleLayer('enrrMobilisablesSolaireThermique.showParkings')}
                    trackingEvent="Carto|Solaire thermique - parkings"
                  />

                  <IconPolygon
                    stroke={themeDefSolaireThermiqueParkings.color}
                    fillOpacity={themeDefSolaireThermiqueParkings.opacity}
                    mt="1v"
                  />

                  <Text
                    as="label"
                    htmlFor="parkings"
                    fontSize="14px"
                    lineHeight="18px"
                    className="fr-col"
                    fontWeight="bold"
                    cursor="pointer"
                    pt="1v"
                    px="1v"
                  >
                    Parkings
                  </Text>
                </Box>
              </DeactivatableBox>
            </TrackableCheckableAccordion>
          </UrlStateAccordion>
        </Box>
      )}
      <DevModeIcon />
    </Tabs>
  );
}

export default SimpleMapLegend;
