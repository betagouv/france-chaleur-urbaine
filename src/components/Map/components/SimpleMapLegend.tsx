import Button from '@codegouvfr/react-dsfr/Button';
import Image from 'next/image';
import { parseAsBoolean, useQueryState } from 'nuqs';

import Hoverable from '@components/Hoverable';
import {
  LegendDeskData,
  besoinsEnChaleurIndustrieCommunesIntervals,
  besoinsEnChaleurIntervals,
  besoinsEnFroidIntervals,
  energyLayerMaxOpacity,
} from '@components/Map/map-layers';
import { UrlStateAccordion } from '@components/ui/Accordion';
import Box from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import Icon from '@components/ui/Icon';
import Link from '@components/ui/Link';
import Text from '@components/ui/Text';
import { setProperty, toggleBoolean } from '@utils/core';
import { Interval } from '@utils/interval';
import { themeDefBuildings, themeDefDemands, themeDefEnergy, themeDefTypeGas } from 'src/services/Map/businessRules';
import { themeDefSolaireThermiqueFriches, themeDefSolaireThermiqueParkings } from 'src/services/Map/businessRules/enrrMobilisables';
import { themeDefZonePotentielChaud, themeDefZonePotentielFortChaud } from 'src/services/Map/businessRules/zonePotentielChaud';
import { MapConfiguration, MapConfigurationProperty, defaultMapConfiguration } from 'src/services/Map/map-configuration';

import DevModeIcon from './DevModeIcon';
import IconPolygon from './IconPolygon';
import MapLegendReseaux, { type MapLegendFeature } from './MapLegendReseaux';
import ModalCarteFrance from './ModalCarteFrance';
import DistancesMeasurementTool from './outils/DistancesMeasurementTool';
import ScaleLegend from './ScaleLegend';
import {
  DeactivatableBox,
  InfoIcon,
  SingleCheckbox,
  TabId,
  TabObject,
  Tabs,
  TrackableCheckableAccordion,
  parseURLTabs,
  tabs,
} from './SimpleMapLegend.style';

const consommationsGazLegendColor = '#D9D9D9';
const consommationsGazUsageLegendOpacity = 0.53;

interface SimpleMapLegendProps {
  enabledFeatures?: MapLegendFeature[];
  mapConfiguration: MapConfiguration;
  onMapConfigurationChange: (config: MapConfiguration) => void;
  legendTitle?: string;
}

const defaultURL: TabObject = { tabId: 'reseaux', subTabId: null };

function SimpleMapLegend({ mapConfiguration, onMapConfigurationChange, legendTitle, enabledFeatures }: SimpleMapLegendProps) {
  const [selectedTabId, setSelectedTabId] = useQueryState<TabObject>('tabId', parseURLTabs(tabs).withDefault(defaultURL));
  const [filtersVisible, setFiltersVisible] = useQueryState('showFilters', parseAsBoolean);

  function toggleLayer(property: MapConfigurationProperty<boolean>) {
    toggleBoolean(mapConfiguration, property);
    onMapConfigurationChange({ ...mapConfiguration });
  }

  const updateScaleInterval = (property: MapConfigurationProperty<Interval>) => (interval: Interval) => {
    setProperty(mapConfiguration, property, interval);
    onMapConfigurationChange({ ...mapConfiguration });
  };

  const nbCouchesFondBatiments =
    (mapConfiguration.caracteristiquesBatiments ? 1 : 0) +
    (mapConfiguration.besoinsEnChaleur ? 1 : 0) +
    (mapConfiguration.besoinsEnFroid ? 1 : 0);

  if (enabledFeatures) {
    // This is an iframe, don't show tabs
    return (
      <Box my="2w">
        <MapLegendReseaux
          enabledFeatures={enabledFeatures}
          mapConfiguration={mapConfiguration}
          onMapConfigurationChange={onMapConfigurationChange}
          legendTitle={legendTitle}
          filtersVisible={!!filtersVisible}
          updateScaleInterval={updateScaleInterval}
          setFiltersVisible={setFiltersVisible}
          toggleLayer={toggleLayer}
        />
      </Box>
    );
  }

  return (
    <Box my="2w">
      <Tabs
        selectedTabId={selectedTabId.tabId}
        tabs={tabs}
        onTabChange={(newTabId) => setSelectedTabId({ tabId: newTabId as TabId, subTabId: null })}
      >
        {selectedTabId.tabId === 'reseaux' && (
          <>
            <MapLegendReseaux
              enabledFeatures={enabledFeatures}
              mapConfiguration={mapConfiguration}
              onMapConfigurationChange={onMapConfigurationChange}
              legendTitle={legendTitle}
              filtersVisible={!!filtersVisible}
              updateScaleInterval={updateScaleInterval}
              setFiltersVisible={setFiltersVisible}
              toggleLayer={toggleLayer}
            />
            <Box mt="4w" mb="4w" display="flex" flexDirection="column" alignItems="stretch" justifyContent="center" gap="8px">
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
                variant="primary"
                href="https://www.data.gouv.fr/fr/datasets/traces-des-reseaux-de-chaleur-et-de-froid/"
                eventKey="Téléchargement|Tracés|carte"
                className="fr-btn--tertiary d-flex"
                mx="auto"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Icon name="ri-download-line" size="sm" mr="1v" />
                Télécharger les tracés
              </Link>
            </Box>
          </>
        )}
        {selectedTabId.tabId === 'potentiel' && (
          <Box mt="2v" mx="1w">
            <Heading as="h2" size="h6" mb="1w">
              {'Potentiel'}
            </Heading>
            <Box display="flex" mb="2w">
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
                height="16px"
                width="16px"
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
                mapConfiguration={mapConfiguration}
                toggleLayer={toggleLayer}
                name="consommationsGaz"
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
                  <Box display="flex" flexWrap="wrap" px="3w">
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
                    className="fr-ml-3w fr-mr-1w"
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
                mapConfiguration={mapConfiguration}
                toggleLayer={toggleLayer}
                name="batimentsGazCollectif"
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
                    className="fr-ml-3w fr-mr-1w"
                    label="Nombre de lots d'habitation"
                    color={themeDefEnergy.gas.color}
                    domain={[LegendDeskData.energy.min, LegendDeskData.energy.max]}
                    defaultValues={defaultMapConfiguration.batimentsGazCollectif.interval}
                    onChange={updateScaleInterval('batimentsGazCollectif.interval')}
                  />
                </DeactivatableBox>
              </TrackableCheckableAccordion>
              <TrackableCheckableAccordion
                mapConfiguration={mapConfiguration}
                toggleLayer={toggleLayer}
                name="batimentsFioulCollectif"
                trackingEvent="Carto|Bâtiments au fioul collectif"
                label={
                  <>
                    <Box
                      backgroundColor={themeDefEnergy.fuelOil.color}
                      opacity={energyLayerMaxOpacity}
                      height="16px"
                      width="16px"
                      mt="1v"
                    />
                    <span>Bâtiments chauffés au fioul collectif</span>
                  </>
                }
              >
                <DeactivatableBox disabled={!mapConfiguration.batimentsFioulCollectif.show}>
                  <ScaleLegend
                    className="fr-ml-3w fr-mr-1w"
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
                  mapConfiguration={mapConfiguration}
                  toggleLayer={toggleLayer}
                  name="besoinsEnChaleur"
                  checked={mapConfiguration.besoinsEnChaleur}
                  layerName={''}
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
                      <span>Besoins en chaleur</span>
                      <InfoIcon>
                        <Icon size="sm" name="ri-information-fill" cursor="help" />

                        <Hoverable position="bottom">
                          Modélisation réalisée par le Cerema dans le cadre du projet EnRezo.
                          <br />
                          <Link href="https://reseaux-chaleur.cerema.fr/cartographie-nationale-besoins-chaleur-froid" isExternal>
                            Accéder à la méthodologie
                          </Link>
                        </Hoverable>
                      </InfoIcon>
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
                  mapConfiguration={mapConfiguration}
                  toggleLayer={toggleLayer}
                  name="besoinsEnFroid"
                  checked={mapConfiguration.besoinsEnFroid}
                  layerName={''}
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

                      <span>Besoins en froid</span>
                      <InfoIcon>
                        <Icon size="sm" name="ri-information-fill" cursor="help" />

                        <Hoverable position="bottom">
                          Modélisation réalisée par le Cerema dans le cadre du projet EnRezo.
                          <br />
                          <Link href="https://reseaux-chaleur.cerema.fr/cartographie-nationale-besoins-chaleur-froid" isExternal>
                            Accéder à la méthodologie
                          </Link>
                        </Hoverable>
                      </InfoIcon>
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
                  mapConfiguration={mapConfiguration}
                  toggleLayer={toggleLayer}
                  name="caracteristiquesBatiments"
                  checked={mapConfiguration.caracteristiquesBatiments}
                  layerName={''}
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
                      <span>Caractéristiques des bâtiments</span>
                      <InfoIcon>
                        <Icon size="sm" name="ri-information-fill" cursor="help" />

                        <Hoverable position="bottom">
                          Les DPE affichés par bâtiment résultent d'un extrapolation des DPE par logement ancienne définition. Ils sont
                          donnés à titre informatif et non-officiel, sans aucune valeur légale.
                        </Hoverable>
                      </InfoIcon>
                    </>
                  }
                >
                  <DeactivatableBox disabled={!mapConfiguration.caracteristiquesBatiments} ml="3w" mr="1w">
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
                mapConfiguration={mapConfiguration}
                toggleLayer={toggleLayer}
                name="zonesOpportunite"
                trackingEvent="Carto|Zones d'opportunité"
                label={
                  <>
                    <IconPolygon
                      stroke={themeDefZonePotentielFortChaud.fill.color}
                      fillOpacity={themeDefZonePotentielFortChaud.fill.opacity}
                      mt="1v"
                    />
                    <span>Zones d'opportunité pour la création de réseaux de chaleur</span>
                    <InfoIcon>
                      <Icon size="sm" name="ri-information-fill" cursor="help" />

                      <Hoverable position="bottom">
                        Modélisation réalisée par le Cerema dans le cadre du projet EnRezo.
                        <br />
                        <Link
                          href="https://reseaux-chaleur.cerema.fr/sites/reseaux-chaleur-v2/files/fichiers/2024/01/Methodologie_zones_opportunite_VF.pdf"
                          isExternal
                        >
                          Accéder à la méthodologie
                        </Link>
                      </Hoverable>
                    </InfoIcon>
                  </>
                }
              >
                <DeactivatableBox disabled={!mapConfiguration.zonesOpportunite.show} display="flex" flexWrap="wrap" ml="3w" mr="1w">
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
                mapConfiguration={mapConfiguration}
                toggleLayer={toggleLayer}
                name="besoinsEnChaleurIndustrieCommunes"
                checked={mapConfiguration.besoinsEnChaleurIndustrieCommunes}
                layerName={''}
                trackingEvent="Carto|Besoins en chaleur secteur industriel"
                label={
                  <>
                    <IconPolygon
                      stroke={besoinsEnChaleurIndustrieCommunesIntervals[besoinsEnChaleurIndustrieCommunesIntervals.length - 1].color}
                      fillOpacity={0.7}
                      mt="1v"
                    />
                    <span>Besoins en chaleur du secteur industriel</span>
                    <InfoIcon>
                      <Icon size="sm" name="ri-information-fill" cursor="help" />

                      <Hoverable position="bottom">
                        Modélisation réalisée par le Cerema dans le cadre du projet EnRezo.
                        <br />
                        <Link
                          href="https://reseaux-chaleur.cerema.fr/sites/reseaux-chaleur-v2/files/fichiers/2024/06/methodologie_besoin_industrie_2024.pdf"
                          isExternal
                        >
                          Accéder à la méthodologie
                        </Link>
                      </Hoverable>
                    </InfoIcon>
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
              <Box textAlign="center" mt="5w">
                <ModalCarteFrance />
              </Box>
            </UrlStateAccordion>
          </Box>
        )}
        {selectedTabId.tabId === 'outils' && (
          <Box mt="2v" mx="1w">
            {selectedTabId.subTabId === null ? (
              <Box display="flex" flexDirection="column" gap="16px">
                <Heading as="h2" size="h6" mb="1w">
                  Outils
                </Heading>

                <Button
                  priority="secondary"
                  size="small"
                  onClick={() => setSelectedTabId({ tabId: 'outils', subTabId: 'mesure-distance' })}
                >
                  Calculer une distance
                </Button>
                <Button
                  priority="secondary"
                  size="small"
                  onClick={() => setSelectedTabId({ tabId: 'outils', subTabId: 'extraire-données-batiment' })}
                >
                  Extraire des données sur les bâtiments
                </Button>
                <Button
                  priority="secondary"
                  size="small"
                  onClick={() => setSelectedTabId({ tabId: 'outils', subTabId: 'densité-thermique-linéaire' })}
                >
                  Calculer une densité thermique linéaire
                </Button>

                <Box display="flex" alignItems="center" gap="16px">
                  <Link href="/documentation/carto_sources.pdf" isExternal eventKey="Téléchargement|Carto sources">
                    <Text as="span" size="xs">
                      Sources
                    </Text>
                  </Link>
                  <DevModeIcon />
                </Box>
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
            {selectedTabId.subTabId === 'extraire-données-batiment' && <Box>Extraire des données sur les bâtiments</Box>}
            {selectedTabId.subTabId === 'densité-thermique-linéaire' && <Box>Calculer une densité thermique linéaire</Box>}
          </Box>
        )}
        {selectedTabId.tabId === 'enrr' && (
          <Box mt="2v" mx="1w">
            <Heading as="h2" size="h6" mb="1w">
              Énergies renouvelables et de récupération
            </Heading>
            <UrlStateAccordion label="Mobilisables" small>
              <TrackableCheckableAccordion
                mapConfiguration={mapConfiguration}
                toggleLayer={toggleLayer}
                name="enrrMobilisablesChaleurFatale"
                trackingEvent="Carto|ENR&R Mobilisables"
                label={
                  <>
                    <span>Chaleur fatale</span>
                    <InfoIcon>
                      <Icon size="sm" name="ri-information-fill" cursor="help" />

                      <Hoverable position="bottom">
                        Données du projet{' '}
                        <Link href="https://reseaux-chaleur.cerema.fr/espace-documentaire/enrezo" isExternal>
                          EnRezo
                        </Link>{' '}
                        du Cerema.
                      </Hoverable>
                    </InfoIcon>
                  </>
                }
              >
                <DeactivatableBox disabled={!mapConfiguration.enrrMobilisablesChaleurFatale.show} ml="3w" mr="1w">
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

                    <Image
                      src="/icons/enrr_mobilisables_installations_electrogenes.png"
                      alt=""
                      height="16"
                      width="16"
                      className="fr-mt-1v"
                    />

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
                mapConfiguration={mapConfiguration}
                toggleLayer={toggleLayer}
                name="enrrMobilisablesSolaireThermique"
                trackingEvent="Carto|ENR&R Mobilisables"
                label={
                  <>
                    <span>Solaire thermique</span>
                    <InfoIcon>
                      <Icon size="sm" name="ri-information-fill" cursor="help" />

                      <Hoverable position="bottom">
                        Données du projet{' '}
                        <Link href="https://reseaux-chaleur.cerema.fr/espace-documentaire/enrezo" isExternal>
                          EnRezo
                        </Link>{' '}
                        du Cerema.
                      </Hoverable>
                    </InfoIcon>
                  </>
                }
              >
                <DeactivatableBox disabled={!mapConfiguration.enrrMobilisablesSolaireThermique.show} ml="3w" mr="1w">
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
      </Tabs>
      {/* <Box display="flex" alignItems="center">
        <Text fontSize="14px" lineHeight="18px" fontWeight="bold" ml="1w" className="fr-col">
          {legendTitle || 'Réseaux de chaleur et de froid'}
        </Text>

        <Button
          className="fr-px-1w"
          priority="tertiary no outline"
          size="small"
          onClick={() => toggleSectionExpansion('reseauxDeChaleur')}
          aria-expanded={!!sectionsExpansions['reseauxDeChaleur']}
          aria-controls={'reseauxDeChaleur'}
          title="Afficher/Masquer le détail"
        >
          <Icon riSize="1x" name="ri-equalizer-line" />
        </Button>
      </Box> */}
      {/* <CollapsibleBox id="reseauxDeChaleur" expand={!!sectionsExpansions['reseauxDeChaleur']}>
        <LegendSeparator />
      </CollapsibleBox> */}
    </Box>
  );
}

export default SimpleMapLegend;
