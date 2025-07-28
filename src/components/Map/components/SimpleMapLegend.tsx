import Button from '@codegouvfr/react-dsfr/Button';
import Image from 'next/image';
import { useQueryState } from 'nuqs';

import DPE from '@/components/DPE';
import RangeFilter from '@/components/form/dsfr/RangeFilter';
import {
  quartiersPrioritairesPolitiqueVille2015anruColor,
  quartiersPrioritairesPolitiqueVille2024Color,
  quartiersPrioritairesPolitiqueVilleOpacity,
} from '@/components/Map/layers/quartiersPrioritairesPolitiqueVille';
import { defaultMapConfiguration } from '@/components/Map/map-configuration';
import { type MapLegendFeature } from '@/components/Map/map-layers';
import useFCUMap from '@/components/Map/MapProvider';
import { UrlStateAccordion } from '@/components/ui/Accordion';
import Box from '@/components/ui/Box';
import Link from '@/components/ui/Link';
import Text from '@/components/ui/Text';
import Tooltip from '@/components/ui/Tooltip';
import { trackEvent } from '@/services/analytics';
import { useAuthentication } from '@/services/authentication';

import IconPolygon from './IconPolygon';
import MapLegendReseaux from './MapLegendReseaux';
import ModalCarteFrance from './ModalCarteFrance';
import ScaleLegend from './ScaleLegend';
import {
  DeactivatableBox,
  parseURLTabs,
  SingleCheckbox,
  type TabId,
  type TabObject,
  Tabs,
  tabs,
  TabScrollablePart,
  Title,
  TrackableCheckableAccordion,
} from './SimpleMapLegend.style';
import { besoinsEnChaleurIntervals, besoinsEnFroidIntervals } from '../layers/besoinsEnChaleur';
import { besoinsEnChaleurIndustrieCommunesIntervals } from '../layers/besoinsEnChaleurIndustrieCommunes';
import { caracteristiquesBatimentsLayerStyle } from '../layers/caracteristiquesBatiments';
import {
  communesFortPotentielPourCreationReseauxChaleurInterval,
  communesFortPotentielPourCreationReseauxChaleurLayerColor,
  communesFortPotentielPourCreationReseauxChaleurLayerOpacity,
} from '../layers/communesFortPotentielPourCreationReseauxChaleur';
import { consommationsGazInterval, consommationsGazLayerStyle } from '../layers/consommationsGaz';
import { demandesEligibiliteLayerStyle } from '../layers/demandesEligibilite';
import BuildingsDataExtractionTool from './tools/BuildingsDataExtractionTool';
import DistancesMeasurementTool from './tools/DistancesMeasurementTool';
import LinearHeatDensityTool from './tools/LinearHeatDensityTool';
import { enrrMobilisablesFrichesLayerColor, enrrMobilisablesFrichesLayerOpacity } from '../layers/enrr-mobilisables/friches';
import { enrrMobilisablesParkingsLayerColor, enrrMobilisablesParkingsLayerOpacity } from '../layers/enrr-mobilisables/parkings';
import {
  enrrMobilisablesThalassothermieLayerColor,
  enrrMobilisablesThalassothermieLayerOpacity,
} from '../layers/enrr-mobilisables/thalassothermie';
import {
  enrrMobilisablesZonesGeothermieProfondeLayerColor,
  enrrMobilisablesZonesGeothermieProfondeLayerOpacity,
} from '../layers/enrr-mobilisables/zonesGeothermieProfonde';
import { etudesEnCoursColor, etudesEnCoursOpacity } from '../layers/etudesEnCours';
import {
  installationsGeothermieProfondeLayerColor,
  installationsGeothermieProfondeLayerOpacity,
} from '../layers/geothermie/installationsGeothermieProfonde';
import {
  installationsGeothermieSurfaceEchangeursFermesDeclareeColor,
  installationsGeothermieSurfaceEchangeursFermesOpacity,
  installationsGeothermieSurfaceEchangeursFermesRealiseeColor,
  installationsGeothermieSurfaceEchangeursOuvertsDeclareeColor,
  installationsGeothermieSurfaceEchangeursOuvertsOpacity,
  installationsGeothermieSurfaceEchangeursOuvertsRealiseeColor,
} from '../layers/geothermie/installationsGeothermieSurface';
import {
  ouvragesGeothermieSurfaceEchangeursFermesDeclareeColor,
  ouvragesGeothermieSurfaceEchangeursFermesOpacity,
  ouvragesGeothermieSurfaceEchangeursFermesRealiseeColor,
  ouvragesGeothermieSurfaceEchangeursOuvertsDeclareeColor,
  ouvragesGeothermieSurfaceEchangeursOuvertsOpacity,
  ouvragesGeothermieSurfaceEchangeursOuvertsRealiseeColor,
} from '../layers/geothermie/ouvragesGeothermieSurface';
import {
  aquifereColorMap,
  perimetresGeothermieProfondeLayerOpacity,
  statutColorMap,
} from '../layers/geothermie/perimetresGeothermieProfonde';
import { testsAdressesLayerStyle } from '../layers/testsAdresses';
import {
  energyFilterInterval,
  typeChauffageBatimentsCollectifsStyle,
  typeChauffageBatimentsOpacity,
} from '../layers/typeChauffageBatimentsCollectifs';
import { zonePotentielChaudColor, zonePotentielChaudOpacity, zonePotentielFortChaudColor } from '../layers/zonesPotentielChaud';

const consommationsGazLegendColor = '#D9D9D9';
const consommationsGazUsageLegendOpacity = 0.53;

interface SimpleMapLegendProps {
  enabledFeatures?: MapLegendFeature[];
  legendTitle?: string;
  withComptePro?: boolean;
}

const defaultURL: TabObject = { tabId: 'reseaux', subTabId: null };

function SimpleMapLegend({ legendTitle, enabledFeatures, withComptePro = true }: SimpleMapLegendProps) {
  const { hasRole } = useAuthentication();
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
        isIframeContext
        withComptePro={false}
      />
    );
  }

  return (
    <Tabs
      selectedTabId={selectedTabId.tabId}
      tabs={tabs}
      onTabChange={(newTabId: string) => {
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
          withComptePro={withComptePro}
        />
      )}
      {selectedTabId.tabId === 'potentiel' && (
        <TabScrollablePart>
          <Title>Potentiel</Title>
          <Box display="flex" alignItems="start" mb="2w">
            <SingleCheckbox
              name="demandesEligibilite"
              checked={mapConfiguration.demandesEligibilite}
              onChange={() => toggleLayer('demandesEligibilite')}
              trackingEvent="Carto|Demandes de raccordement"
            />

            <Box
              backgroundColor={demandesEligibiliteLayerStyle.fill.color}
              border={`2px solid ${demandesEligibiliteLayerStyle.stroke.color}`}
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

          {hasRole('admin') && (
            <Box display="flex" alignItems="start" mb="2w">
              <SingleCheckbox
                name="testsAdresses"
                checked={mapConfiguration.testsAdresses}
                onChange={() => toggleLayer('testsAdresses')}
                trackingEvent="Carto|Adresses testées"
              />

              <Box
                backgroundColor={testsAdressesLayerStyle.eligible.fill.color}
                border={`2px solid ${testsAdressesLayerStyle.eligible.stroke.color}`}
                borderRadius="50%"
                minHeight="16px"
                minWidth="16px"
                mt="1v"
              />
              <Box
                backgroundColor={testsAdressesLayerStyle.notEligible.fill.color}
                border={`2px solid ${testsAdressesLayerStyle.notEligible.stroke.color}`}
                borderRadius="50%"
                minHeight="16px"
                minWidth="16px"
                ml="1v"
                mt="1v"
              />

              <Text
                as="label"
                htmlFor="testsAdresses"
                fontSize="14px"
                lineHeight="18px"
                className="fr-col"
                cursor="pointer"
                pl="1w"
                style={{ marginTop: '2px' }}
              >
                Adresses testées
              </Text>
            </Box>
          )}
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

                    <Box backgroundColor={consommationsGazLayerStyle.R} height="10px" width="10px" borderRadius="50%" mt="2v" />

                    <Text
                      as="label"
                      htmlFor="consommationsGazLogements"
                      fontSize="14px"
                      lineHeight="18px"
                      className="fr-col"
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

                    <Box backgroundColor={consommationsGazLayerStyle.T} height="10px" width="10px" borderRadius="50%" mt="2v" />

                    <Text
                      as="label"
                      htmlFor="consommationsGazTertiaire"
                      fontSize="14px"
                      lineHeight="18px"
                      className="fr-col"
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

                    <Box backgroundColor={consommationsGazLayerStyle.I} height="10px" width="10px" borderRadius="50%" mt="2v" />

                    <Text
                      as="label"
                      htmlFor="consommationsGazIndustrie"
                      fontSize="14px"
                      lineHeight="18px"
                      className="fr-col"
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
                  domain={[consommationsGazInterval.min, consommationsGazInterval.max]}
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
                  <Box
                    backgroundColor={typeChauffageBatimentsCollectifsStyle.gas}
                    opacity={typeChauffageBatimentsOpacity}
                    height="16px"
                    width="16px"
                    mt="1v"
                  />
                  <span>Bâtiments chauffés au gaz collectif</span>
                </>
              }
            >
              <DeactivatableBox disabled={!mapConfiguration.batimentsGazCollectif.show}>
                <ScaleLegend
                  className="fr-ml-1w fr-mr-1w"
                  label="Nombre de lots d'habitation"
                  color={typeChauffageBatimentsCollectifsStyle.gas}
                  domain={[energyFilterInterval.min, energyFilterInterval.max]}
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
                  <Box
                    backgroundColor={typeChauffageBatimentsCollectifsStyle.fuelOil}
                    opacity={typeChauffageBatimentsOpacity}
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
                  className="fr-ml-1w fr-mr-1w"
                  label="Nombre de lots d'habitation"
                  color={typeChauffageBatimentsCollectifsStyle.fuelOil}
                  domain={[energyFilterInterval.min, energyFilterInterval.max]}
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
                      backgroundColor={caracteristiquesBatimentsLayerStyle.c}
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
                    {Object.entries(caracteristiquesBatimentsLayerStyle).map(([letter]) => (
                      <DPE classe={letter} key={letter} />
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
                  <IconPolygon stroke={zonePotentielFortChaudColor} fillOpacity={zonePotentielChaudOpacity} mt="1v" />
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

                  <IconPolygon stroke={zonePotentielChaudColor} fillOpacity={zonePotentielChaudOpacity} mt="1v" />

                  <Text
                    as="label"
                    htmlFor="zonesPotentielChaud"
                    fontSize="14px"
                    lineHeight="18px"
                    className="fr-col"
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

                  <IconPolygon stroke={zonePotentielFortChaudColor} fillOpacity={zonePotentielChaudOpacity} mt="1v" />

                  <Text
                    as="label"
                    htmlFor="zonesPotentielFortChaud"
                    fontSize="14px"
                    lineHeight="18px"
                    className="fr-col"
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

            <Box display="flex" alignItems="start" my="2w">
              <SingleCheckbox
                name="etudesEnCours"
                checked={mapConfiguration.etudesEnCours}
                onChange={() => toggleLayer('etudesEnCours')}
                trackingEvent="Carto|Etudes en cours"
              />

              <IconPolygon stroke={etudesEnCoursColor} fillOpacity={etudesEnCoursOpacity} mt="1v" />

              <Text
                as="label"
                htmlFor="etudesEnCours"
                fontSize="14px"
                className="fr-col"
                cursor="pointer"
                pl="1w"
                style={{ marginTop: '2px' }}
              >
                Communes couvertes par une étude pour la création de réseaux
              </Text>
              <Tooltip
                iconProps={{
                  className: 'fr-mr-4w text-blue',
                }}
                title={<>Information actuellement limitée à l'Île-de-France. Source : ADEME.</>}
              />
            </Box>

            <TrackableCheckableAccordion
              name="quartiersPrioritairesPolitiqueVille"
              checked={mapConfiguration.quartiersPrioritairesPolitiqueVille.show}
              layerName="quartiersPrioritairesPolitiqueVille.show"
              trackingEvent="Carto|Quartiers Prioritaires politique Ville"
              label={
                <>
                  <IconPolygon
                    stroke={quartiersPrioritairesPolitiqueVille2024Color}
                    fillOpacity={quartiersPrioritairesPolitiqueVilleOpacity}
                    mt="1v"
                  />
                  <Box flex>Quartiers prioritaires de la politique de la ville (QPV)</Box>
                  <Tooltip
                    title={
                      <>
                        Les périmètres des QPV sont{' '}
                        <Link
                          href="https://www.data.gouv.fr/fr/datasets/quartiers-prioritaires-de-la-politique-de-la-ville-qpv/"
                          isExternal
                        >
                          diffusés par l'ANCT sur data.gouv.fr
                        </Link>
                        . Les quartiers engagés dans le Nouveau Programme National de Renouvellement Urbain porté par l'ANRU sont basés sur
                        les périmètres définis en 2015, et non sur ceux de 2024. La liste de ces quartiers a été transmise à France Chaleur
                        Urbaine par l'ANRU.
                      </>
                    }
                  />
                </>
              }
            >
              <DeactivatableBox display="flex" flexDirection="column" ml="1w" mr="1w">
                <Box display="flex">
                  <SingleCheckbox
                    name="quartiersPrioritairesPolitiqueVille2015anru"
                    checked={mapConfiguration.quartiersPrioritairesPolitiqueVille.qpv2015anru}
                    onChange={() => toggleLayer('quartiersPrioritairesPolitiqueVille.qpv2015anru')}
                    trackingEvent="Carto|Quartiers Prioritaires politique Ville 2015 ANRU"
                  />

                  <IconPolygon
                    stroke={quartiersPrioritairesPolitiqueVille2015anruColor}
                    fillOpacity={quartiersPrioritairesPolitiqueVilleOpacity}
                    mt="1v"
                  />

                  <Text
                    as="label"
                    htmlFor="quartiersPrioritairesPolitiqueVille2015anru"
                    fontSize="14px"
                    lineHeight="18px"
                    className="fr-col"
                    cursor="pointer"
                    pt="1v"
                    px="1v"
                  >
                    QPV du Nouveau Programme National de Renouvellement Urbain (ANRU)
                  </Text>
                </Box>

                <Box display="flex">
                  <SingleCheckbox
                    name="quartiersPrioritairesPolitiqueVille2024"
                    checked={mapConfiguration.quartiersPrioritairesPolitiqueVille.qpv2024}
                    onChange={() => toggleLayer('quartiersPrioritairesPolitiqueVille.qpv2024')}
                    trackingEvent="Carto|Quartiers Prioritaires politique Ville 2024"
                  />

                  <IconPolygon
                    stroke={quartiersPrioritairesPolitiqueVille2024Color}
                    fillOpacity={quartiersPrioritairesPolitiqueVilleOpacity}
                    mt="1v"
                  />

                  <Text
                    as="label"
                    htmlFor="quartiersPrioritairesPolitiqueVille2024"
                    fontSize="14px"
                    lineHeight="18px"
                    className="fr-col"
                    cursor="pointer"
                    pt="1v"
                    px="1v"
                  >
                    QPV 2024
                  </Text>
                </Box>
              </DeactivatableBox>
            </TrackableCheckableAccordion>
            <Box textAlign="center" mt="2w" mb="1w">
              <ModalCarteFrance />
            </Box>
          </UrlStateAccordion>
        </TabScrollablePart>
      )}
      {selectedTabId.tabId === 'outils' && (
        <TabScrollablePart>
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
        </TabScrollablePart>
      )}
      {selectedTabId.tabId === 'enrr' && (
        <TabScrollablePart>
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
                    cursor="pointer"
                    pt="1v"
                    px="1v"
                  >
                    Datacenters
                  </Text>
                </Box>
                <Box display="flex">
                  <SingleCheckbox
                    name="installationsElectrogenes"
                    checked={mapConfiguration.enrrMobilisablesChaleurFatale.showInstallationsElectrogenes}
                    onChange={() => toggleLayer('enrrMobilisablesChaleurFatale.showInstallationsElectrogenes')}
                    trackingEvent="Carto|Installations électrogènes"
                  />

                  <Image src="/icons/enrr_mobilisables_installations_electrogenes.png" alt="" height="16" width="16" className="fr-mt-1v" />

                  <Text
                    as="label"
                    htmlFor="installationsElectrogenes"
                    fontSize="14px"
                    lineHeight="18px"
                    className="fr-col"
                    cursor="pointer"
                    pt="1v"
                    px="1v"
                  >
                    Installations électrogènes
                  </Text>
                </Box>
              </DeactivatableBox>
            </TrackableCheckableAccordion>

            <Box display="flex" alignItems="center" my="2w">
              <SingleCheckbox
                name="enrrMobilisablesGeothermieProfonde"
                checked={mapConfiguration.enrrMobilisablesGeothermieProfonde}
                onChange={() => toggleLayer('enrrMobilisablesGeothermieProfonde')}
                trackingEvent="Carto|Zones géothermie profonde"
              />

              <IconPolygon
                stroke={enrrMobilisablesZonesGeothermieProfondeLayerColor}
                fillOpacity={enrrMobilisablesZonesGeothermieProfondeLayerOpacity}
              />

              <Text
                as="label"
                htmlFor="enrrMobilisablesGeothermieProfonde"
                fontSize="14px"
                lineHeight="18px"
                className="fr-col"
                cursor="pointer"
                pl="1w"
                mt="1v"
              >
                Géothermie profonde
              </Text>
              <Tooltip
                title={
                  <>
                    Gisements potentiels ou prouvés de géothermie profonde en France pour la production de chaleur, issus de la compilation
                    des connaissances géologiques et hydrogéologiques dans les bassins géologiques français.
                    <br />
                    Source :{' '}
                    <Link href="https://www.geothermies.fr/espace-cartographique" isExternal>
                      BRGM
                    </Link>
                  </>
                }
                iconProps={{
                  color: 'var(--text-action-high-blue-france)',
                }}
              />
              {/* spacer */}
              <Box width="32px" />
            </Box>

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

                  <IconPolygon stroke={enrrMobilisablesFrichesLayerColor} fillOpacity={enrrMobilisablesFrichesLayerOpacity} mt="1v" />

                  <Text as="label" htmlFor="friches" fontSize="14px" lineHeight="18px" className="fr-col" cursor="pointer" pt="1v" px="1v">
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

                  <IconPolygon stroke={enrrMobilisablesParkingsLayerColor} fillOpacity={enrrMobilisablesParkingsLayerOpacity} mt="1v" />

                  <Text as="label" htmlFor="parkings" fontSize="14px" lineHeight="18px" className="fr-col" cursor="pointer" pt="1v" px="1v">
                    Parkings
                  </Text>
                </Box>
              </DeactivatableBox>
            </TrackableCheckableAccordion>

            <Box display="flex" alignItems="center" my="2w">
              <SingleCheckbox
                name="enrrMobilisablesThalassothermie"
                checked={mapConfiguration.enrrMobilisablesThalassothermie}
                onChange={() => toggleLayer('enrrMobilisablesThalassothermie')}
                trackingEvent="Carto|Thalassothermie"
              />

              <IconPolygon stroke={enrrMobilisablesThalassothermieLayerColor} fillOpacity={enrrMobilisablesThalassothermieLayerOpacity} />

              <Text
                as="label"
                htmlFor="enrrMobilisablesThalassothermie"
                fontSize="14px"
                lineHeight="18px"
                className="fr-col"
                cursor="pointer"
                pl="1w"
                mt="1v"
              >
                Thalassothermie
              </Text>
              <Tooltip
                title={
                  <>
                    Données mises à disposition par le projet{' '}
                    <Link href="https://reseaux-chaleur.cerema.fr/espace-documentaire/enrezo" isExternal>
                      EnRezo
                    </Link>{' '}
                    du Cerema.
                  </>
                }
                iconProps={{
                  color: 'var(--text-action-high-blue-france)',
                }}
              />
              {/* spacer */}
              <Box width="32px" />
            </Box>
          </UrlStateAccordion>

          <UrlStateAccordion label="Installations existantes" small>
            <TrackableCheckableAccordion
              name="geothermieProfonde"
              checked={mapConfiguration.geothermieProfonde.show}
              layerName="geothermieProfonde.show"
              trackingEvent="Carto|Géothermie profonde"
              label={
                <>
                  <Box flex>Géothermie profonde</Box>
                  <Tooltip
                    className="max-w-[400px]"
                    title={
                      <>
                        Sources :
                        <ul>
                          <li>
                            installations :{' '}
                            <Link href="https://www.geothermies.fr/espace-cartographique" isExternal>
                              BRGM
                            </Link>
                          </li>
                          <li>
                            périmètres d'exploitation :{' '}
                            <Link href="https://www.drieat.ile-de-france.developpement-durable.gouv.fr/" isExternal>
                              DRIEAT
                            </Link>{' '}
                            (juin 2025)
                          </li>
                        </ul>
                      </>
                    }
                  />
                </>
              }
            >
              <DeactivatableBox disabled={!mapConfiguration.geothermieProfonde.show} ml="1w" mr="1w">
                <Box display="flex" alignItems="center">
                  <SingleCheckbox
                    name="installationsGeothermieProfonde"
                    checked={mapConfiguration.geothermieProfonde.showInstallations}
                    onChange={() => toggleLayer('geothermieProfonde.showInstallations')}
                    trackingEvent="Carto|Installations géothermie profonde"
                  />

                  <Box
                    backgroundColor={installationsGeothermieProfondeLayerColor}
                    opacity={installationsGeothermieProfondeLayerOpacity}
                    borderRadius="50%"
                    minHeight="16px"
                    minWidth="16px"
                  />

                  <Text
                    as="label"
                    htmlFor="installationsGeothermieProfonde"
                    fontSize="14px"
                    lineHeight="18px"
                    className="fr-col"
                    cursor="pointer"
                    pt="1v"
                    px="1v"
                  >
                    Installations
                  </Text>
                </Box>

                <Box display="flex">
                  <SingleCheckbox
                    name="perimetresGeothermieProfonde"
                    checked={mapConfiguration.geothermieProfonde.showPerimetres}
                    onChange={() => toggleLayer('geothermieProfonde.showPerimetres')}
                    trackingEvent="Carto|Périmètres géothermie profonde"
                  />

                  <IconPolygon stroke={aquifereColorMap.Dogger} mt="1v" />

                  <Text
                    as="label"
                    htmlFor="perimetresGeothermieProfonde"
                    fontSize="14px"
                    lineHeight="18px"
                    className="fr-col"
                    cursor="pointer"
                    pt="1v"
                    px="1v"
                  >
                    Périmètres d'exploitation
                  </Text>
                </Box>
                {mapConfiguration.geothermieProfonde.show && mapConfiguration.geothermieProfonde.showPerimetres && (
                  <>
                    <Box display="flex" flexWrap="wrap" gap="8px" mt="1w" ml="3w">
                      {Object.entries(aquifereColorMap).map(([aquifere, color]) => (
                        <div className="flex items-center gap-1" key={aquifere}>
                          <IconPolygon stroke={color} fillOpacity={perimetresGeothermieProfondeLayerOpacity} strokeWidth={0} />
                          <div className="text-xs">{aquifere}</div>
                        </div>
                      ))}
                    </Box>
                    <div className="flex items-center gap-1 ml-6 mt-2">
                      <IconPolygon stroke={statutColorMap.Existant} fillOpacity={0} />
                      <div className="text-xs">Existant</div>
                    </div>
                    <div className="flex items-center gap-1 ml-6 mt-1">
                      <IconPolygon stroke={statutColorMap.AR} fillOpacity={0} />
                      <div className="text-xs">Arrêté d'autorisation de recherche</div>
                    </div>
                  </>
                )}
              </DeactivatableBox>
            </TrackableCheckableAccordion>

            <UrlStateAccordion label="Géothermie de surface sur échangeurs ouverts (nappe)" small>
              <TrackableCheckableAccordion
                name="installationsGeothermieSurfaceEchangeursOuverts"
                checked={mapConfiguration.installationsGeothermieSurfaceEchangeursOuverts}
                layerName="installationsGeothermieSurfaceEchangeursOuverts"
                trackingEvent="Carto|Installations géothermie surface ouverts"
                label={
                  <>
                    <Box flex>Installations</Box>
                    <Tooltip
                      title={
                        <>
                          Source :{' '}
                          <Link href="https://www.geothermies.fr/espace-cartographique" isExternal>
                            BRGM
                          </Link>{' '}
                          (juillet 2025)
                        </>
                      }
                    />
                  </>
                }
              >
                <DeactivatableBox disabled={!mapConfiguration.installationsGeothermieSurfaceEchangeursOuverts} mx="1w">
                  <Box display="flex" alignItems="center">
                    <Box
                      backgroundColor={installationsGeothermieSurfaceEchangeursOuvertsRealiseeColor}
                      opacity={installationsGeothermieSurfaceEchangeursOuvertsOpacity}
                      height="10px"
                      width="10px"
                      borderRadius="50%"
                      mr="1w"
                    />

                    <Text size="sm">Installation réalisée</Text>
                  </Box>
                  <Box display="flex" alignItems="center">
                    <Box
                      backgroundColor={installationsGeothermieSurfaceEchangeursOuvertsDeclareeColor}
                      opacity={installationsGeothermieSurfaceEchangeursOuvertsOpacity}
                      height="10px"
                      width="10px"
                      borderRadius="50%"
                      mr="1w"
                    />

                    <Text size="sm">Installation déclarée</Text>
                  </Box>
                </DeactivatableBox>
              </TrackableCheckableAccordion>
              <TrackableCheckableAccordion
                name="ouvragesGeothermieSurfaceEchangeursOuverts"
                checked={mapConfiguration.ouvragesGeothermieSurfaceEchangeursOuverts}
                layerName="ouvragesGeothermieSurfaceEchangeursOuverts"
                trackingEvent="Carto|Ouvrages géothermie surface ouverts"
                label={
                  <>
                    <Box flex>Ouvrages</Box>
                    <Tooltip
                      title={
                        <>
                          Source :{' '}
                          <Link href="https://www.geothermies.fr/espace-cartographique" isExternal>
                            BRGM
                          </Link>{' '}
                          (juillet 2025)
                        </>
                      }
                    />
                  </>
                }
              >
                <DeactivatableBox disabled={!mapConfiguration.ouvragesGeothermieSurfaceEchangeursOuverts} mx="1w">
                  <Box display="flex" alignItems="center">
                    <Box
                      backgroundColor={ouvragesGeothermieSurfaceEchangeursOuvertsRealiseeColor}
                      opacity={ouvragesGeothermieSurfaceEchangeursOuvertsOpacity}
                      height="10px"
                      width="10px"
                      mr="1w"
                    />

                    <Text size="sm">Ouvrage réalisé</Text>
                  </Box>
                  <Box display="flex" alignItems="center">
                    <Box
                      backgroundColor={ouvragesGeothermieSurfaceEchangeursOuvertsDeclareeColor}
                      opacity={ouvragesGeothermieSurfaceEchangeursOuvertsOpacity}
                      height="10px"
                      width="10px"
                      mr="1w"
                    />

                    <Text size="sm">Ouvrage déclaré</Text>
                  </Box>
                </DeactivatableBox>
              </TrackableCheckableAccordion>
            </UrlStateAccordion>
            <UrlStateAccordion label="Géothermie de surface sur échangeurs fermés (sonde)" small>
              <TrackableCheckableAccordion
                name="installationsGeothermieSurfaceEchangeursFermes"
                checked={mapConfiguration.installationsGeothermieSurfaceEchangeursFermes}
                layerName="installationsGeothermieSurfaceEchangeursFermes"
                trackingEvent="Carto|Installations géothermie surface fermés"
                label={
                  <>
                    <Box flex>Installations</Box>
                    <Tooltip
                      title={
                        <>
                          Source :{' '}
                          <Link href="https://www.geothermies.fr/espace-cartographique" isExternal>
                            BRGM
                          </Link>{' '}
                          (juillet 2025)
                        </>
                      }
                    />
                  </>
                }
              >
                <DeactivatableBox disabled={!mapConfiguration.installationsGeothermieSurfaceEchangeursFermes} mx="1w">
                  <Box display="flex" alignItems="center">
                    <Box
                      backgroundColor={installationsGeothermieSurfaceEchangeursFermesRealiseeColor}
                      opacity={installationsGeothermieSurfaceEchangeursFermesOpacity}
                      height="10px"
                      width="10px"
                      borderRadius="50%"
                      mr="1w"
                    />

                    <Text size="sm">Installation réalisée</Text>
                  </Box>
                  <Box display="flex" alignItems="center">
                    <Box
                      backgroundColor={installationsGeothermieSurfaceEchangeursFermesDeclareeColor}
                      opacity={installationsGeothermieSurfaceEchangeursFermesOpacity}
                      height="10px"
                      width="10px"
                      borderRadius="50%"
                      mr="1w"
                    />

                    <Text size="sm">Installation déclarée</Text>
                  </Box>
                </DeactivatableBox>
              </TrackableCheckableAccordion>

              <TrackableCheckableAccordion
                name="ouvragesGeothermieSurfaceEchangeursFermes"
                checked={mapConfiguration.ouvragesGeothermieSurfaceEchangeursFermes}
                layerName="ouvragesGeothermieSurfaceEchangeursFermes"
                trackingEvent="Carto|Ouvrages géothermie surface fermés"
                label={
                  <>
                    <Box flex>Ouvrages</Box>
                    <Tooltip
                      title={
                        <>
                          Source :{' '}
                          <Link href="https://www.geothermies.fr/espace-cartographique" isExternal>
                            BRGM
                          </Link>{' '}
                          (juillet 2025)
                        </>
                      }
                    />
                  </>
                }
              >
                <DeactivatableBox disabled={!mapConfiguration.ouvragesGeothermieSurfaceEchangeursFermes} mx="1w">
                  <Box display="flex" alignItems="center">
                    <Box
                      backgroundColor={ouvragesGeothermieSurfaceEchangeursFermesRealiseeColor}
                      opacity={ouvragesGeothermieSurfaceEchangeursFermesOpacity}
                      height="10px"
                      width="10px"
                      mr="1w"
                    />

                    <Text size="sm">Ouvrage réalisé</Text>
                  </Box>
                  <Box display="flex" alignItems="center">
                    <Box
                      backgroundColor={ouvragesGeothermieSurfaceEchangeursFermesDeclareeColor}
                      opacity={ouvragesGeothermieSurfaceEchangeursFermesOpacity}
                      height="10px"
                      width="10px"
                      mr="1w"
                    />

                    <Text size="sm">Ouvrage déclaré</Text>
                  </Box>
                </DeactivatableBox>
              </TrackableCheckableAccordion>
            </UrlStateAccordion>
          </UrlStateAccordion>
        </TabScrollablePart>
      )}
    </Tabs>
  );
}

export default SimpleMapLegend;
