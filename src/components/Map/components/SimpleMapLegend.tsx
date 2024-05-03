import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import ModalCarteFrance from './ModalCarteFrance';
import Text from '@components/ui/Text';
import { trackEvent } from 'src/services/analytics';
import Image from 'next/image';
import { Button, Select } from '@dataesr/react-dsfr';
import Link from '@components/ui/Link';
import Icon from '@components/ui/Icon';
import { LegendSeparator } from '../Map.style';
import Box from '@components/ui/Box';
import Hoverable from '@components/Hoverable';
import {
  themeDefBuildings,
  themeDefDemands,
  themeDefEnergy,
  themeDefHeatNetwork,
  themeDefTypeGas,
  themeDefZoneDP,
} from 'src/services/Map/businessRules';
import ScaleLegend from './ScaleLegend';
import {
  MapConfiguration,
  MapConfigurationProperty,
  defaultMapConfiguration,
  filtresEnergies,
  percentageMaxInterval,
} from 'src/services/Map/map-configuration';
import { setProperty, toggleBoolean } from '@utils/core';
import CollapsibleBox from '@components/ui/CollapsibleBox';
import {
  LegendDeskData,
  energyLayerMaxOpacity,
  batimentsRaccordesLayerMaxOpacity,
} from '../map-layers';
import {
  DeactivatableBox,
  InfoIcon,
  PotentielsRaccordementButton,
  SingleCheckbox,
} from './SimpleMapLegend.style';
import IconPolygon from './IconPolygon';
import {
  themeDefSolaireThermiqueFriches,
  themeDefSolaireThermiqueParkings,
} from 'src/services/Map/businessRules/enrrMobilisables';
import {
  themeDefZonePotentielChaud,
  themeDefZonePotentielFortChaud,
} from 'src/services/Map/businessRules/zonePotentielChaud';
import DevModeIcon from './DevModeIcon';
import RangeFilter from './RangeFilter';

const consommationsGazLegendColor = '#D9D9D9';
const consommationsGazUsageLegendOpacity = 0.53;

export const mapLegendFeatures = [
  'reseauxDeChaleur',
  'reseauxDeFroid',
  'reseauxEnConstruction',
  'zonesDeDeveloppementPrioritaire',
  'demandesEligibilite',
  'consommationsGaz',
  'batimentsGazCollectif',
  'batimentsFioulCollectif',
  'batimentsRaccordes',
  'enrrMobilisables',
  'zonesOpportunite',
  'caracteristiquesBatiments',
  'proModeLegend', // texte incitant à activer le mode pro
  'contributeButton', // boutons contribuer et télécharger les tracés
  'cartePotentielsRaccordements', // lien d'ouverture de la carte des potentiels de raccordement
  'sources', // lien vers le PDF d'explication des sources
] as const;

export type MapLegendFeature = (typeof mapLegendFeatures)[number];

interface SimpleMapLegendProps {
  enabledFeatures?: MapLegendFeature[];
  mapConfiguration: MapConfiguration;
  onMapConfigurationChange: (config: MapConfiguration) => void;
  legendTitle?: string;
}

const expansions = [
  'reseauxDeChaleur',
  'reseauxDeChaleurEnergies',
  'consommationsGaz',
  'batimentsGazCollectif',
  'batimentsFioulCollectif',
  'enrrMobilisables',
  'zonesOpportunite',
  'caracteristiquesBatiments',
] as const;
type Expansion = (typeof expansions)[number];

function SimpleMapLegend({
  mapConfiguration,
  onMapConfigurationChange,
  legendTitle,
  ...props
}: SimpleMapLegendProps) {
  const router = useRouter();

  const enabledFeatures = useMemo(() => {
    return props.enabledFeatures ?? mapLegendFeatures;
  }, [props.enabledFeatures]);

  const [sectionsExpansions, setSectionsExpansions] = useState<
    Partial<{ [key in Expansion]: boolean }>
  >({});

  function toggleSectionExpansion(section: Expansion) {
    setSectionExpansion(section, !sectionsExpansions[section]);
  }

  function setSectionExpansion(section: Expansion, expanded: boolean) {
    setSectionsExpansions({
      ...sectionsExpansions,
      [section]: expanded,
    });
  }

  function toggleLayer(property: MapConfigurationProperty) {
    toggleBoolean(mapConfiguration, property);
    onMapConfigurationChange({ ...mapConfiguration });
  }

  function updateScaleInterval(
    property: MapConfigurationProperty,
    interval: [number, number]
  ) {
    setProperty(mapConfiguration, property, interval);
    onMapConfigurationChange({ ...mapConfiguration });
  }

  // Ouvre la modale de la carte quand potentiels-de-raccordement est dans l'URL
  const [showStatsModal, setShowStatsModal] = useState(false);
  useEffect(() => {
    if (router.query['potentiels-de-raccordement'] !== undefined) {
      setShowStatsModal(true);
    }
  }, []);

  return (
    <>
      <Box display="flex" alignItems="center">
        <Text
          fontSize="14px"
          lineHeight="18px"
          fontWeight="bold"
          ml="1w"
          className="fr-col"
        >
          {legendTitle || 'Réseaux de chaleur et de froid'}
        </Text>

        <Button
          className="fr-px-1w"
          hasBorder={false}
          size="sm"
          onClick={() => toggleSectionExpansion('reseauxDeChaleur')}
          title="Afficher/Masquer le détail"
        >
          <Icon size="lg" name="ri-equalizer-line" />
        </Button>
      </Box>
      <Text
        fontSize="13px"
        lineHeight="18px"
        fontWeight="lightbold"
        fontStyle="italic"
        mx="1w"
      >
        Cliquez sur un réseau pour connaître ses caractéristiques
      </Text>

      <CollapsibleBox expand={!!sectionsExpansions['reseauxDeChaleur']}>
        <DeactivatableBox disabled={!mapConfiguration.reseauxDeChaleur.show}>
          <LegendSeparator />
          <Text size="xs" lineHeight="15px" fontStyle="italic" mx="1w">
            Filtres uniquement sur les réseaux de chaleur existants, pour
            lesquels les données sont disponibles.
          </Text>

          <Box mx="1w">
            <Text size="sm" lineHeight="18px" fontWeight="bold" my="1w">
              Énergie majoritaire
            </Text>
            <Select
              selected={mapConfiguration.reseauxDeChaleur.energieMajoritaire}
              options={[
                {
                  label: "Type d'énergie",
                  value: '',
                },
                ...filtresEnergies.map(({ label, confKey }) => ({
                  label,
                  value: confKey,
                })),
              ]}
              onChange={(e) => {
                mapConfiguration.reseauxDeChaleur.energieMajoritaire =
                  e.target.value === '' ? undefined : e.target.value;
                onMapConfigurationChange({ ...mapConfiguration });
              }}
            />
          </Box>

          {!sectionsExpansions['reseauxDeChaleurEnergies'] && (
            <Button
              className="d-block fr-ml-auto fr-mr-1w fr-px-1w"
              hasBorder={false}
              size="sm"
              onClick={() => toggleSectionExpansion('reseauxDeChaleurEnergies')}
              title="Afficher plus de détail"
            >
              Plus d'options
            </Button>
          )}

          <CollapsibleBox
            expand={!!sectionsExpansions['reseauxDeChaleurEnergies']}
          >
            <Box
              backgroundColor="grey-975-75"
              borderRadius="10px"
              mt="1w"
              mx="1w"
              pt="1w"
            >
              <Button
                className="d-block fr-ml-auto"
                hasBorder={false}
                size="sm"
                onClick={() =>
                  toggleSectionExpansion('reseauxDeChaleurEnergies')
                }
                title="Masquer le détail"
              >
                <Icon size="lg" name="ri-close-line" />
              </Button>
              <DeactivatableBox
                disabled={!mapConfiguration.reseauxDeChaleur.show}
              >
                {filtresEnergies.map((filtreEnergie) => (
                  <RangeFilter
                    key={filtreEnergie.confKey}
                    label={filtreEnergie.label}
                    domain={percentageMaxInterval}
                    value={
                      mapConfiguration.reseauxDeChaleur[
                        `energie_ratio_${filtreEnergie.confKey}`
                      ]
                    }
                    onChange={(values) =>
                      updateScaleInterval(
                        `reseauxDeChaleur.energie_ratio_${filtreEnergie.confKey}`,
                        values
                      )
                    }
                    unit="%"
                  />
                ))}
              </DeactivatableBox>
            </Box>
          </CollapsibleBox>

          <LegendSeparator />
          <RangeFilter
            label="Taux d’EnR&R"
            domain={percentageMaxInterval}
            value={mapConfiguration.reseauxDeChaleur.tauxENRR}
            onChange={(values) =>
              updateScaleInterval('reseauxDeChaleur.tauxENRR', values)
            }
            unit="%"
          />
          <LegendSeparator />
          <RangeFilter
            label="Émissions de CO2"
            domain={mapConfiguration.reseauxDeChaleur.limits.emissionsCO2}
            value={mapConfiguration.reseauxDeChaleur.emissionsCO2}
            onChange={(values) =>
              updateScaleInterval('reseauxDeChaleur.emissionsCO2', values)
            }
            unit="gCO2/kWh"
            tooltip="Émissions en analyse du cycle de vie (directes et indirectes)"
          />
          <LegendSeparator />
          <RangeFilter
            label="Prix moyen de la chaleur"
            domain={mapConfiguration.reseauxDeChaleur.limits.prixMoyen}
            value={mapConfiguration.reseauxDeChaleur.prixMoyen}
            onChange={(values) =>
              updateScaleInterval('reseauxDeChaleur.prixMoyen', values)
            }
            unit="€TTC/MWh"
            tooltip="La comparaison avec le prix d'autres modes de chauffage n’est pertinente qu’en coût global annuel, en intégrant les coûts d’exploitation, de maintenance et d’investissement, amortis sur la durée de vie des installations."
          />
          <LegendSeparator />
          <RangeFilter
            label="Livraisons annuelles de chaleur"
            domain={
              mapConfiguration.reseauxDeChaleur.limits.livraisonsAnnuelles
            }
            value={mapConfiguration.reseauxDeChaleur.livraisonsAnnuelles}
            onChange={(values) =>
              updateScaleInterval(
                'reseauxDeChaleur.livraisonsAnnuelles',
                values
              )
            }
            domainTransform={{
              percentToValue: (value) =>
                value * 10 + Math.max(value - 70, 0) * 100,
              valueToPercent: (value) =>
                value / 10 - Math.max(value - 700, 0) / 11,
            }}
            unit="GWh"
          />
          <LegendSeparator />
          <RangeFilter
            label="Année de construction"
            domain={mapConfiguration.reseauxDeChaleur.limits.anneeConstruction}
            value={mapConfiguration.reseauxDeChaleur.anneeConstruction}
            onChange={(values) =>
              updateScaleInterval('reseauxDeChaleur.anneeConstruction', values)
            }
          />
        </DeactivatableBox>
        <LegendSeparator />
      </CollapsibleBox>

      {enabledFeatures.includes('reseauxDeChaleur') && (
        <Box display="flex">
          <SingleCheckbox
            id="reseauxDeChaleur"
            checked={mapConfiguration.reseauxDeChaleur.show}
            onChange={() => toggleLayer('reseauxDeChaleur.show')}
            trackingEvent="Carto|Réseaux chaleur"
          />

          <Box flex>
            <Box display="flex">
              <Box
                backgroundColor={themeDefHeatNetwork.classed.color}
                height="8px"
                minWidth="32px"
                borderRadius="4px"
                mt="1w"
              />

              <Text
                as="label"
                htmlFor="reseauxDeChaleur"
                fontSize="14px"
                lineHeight="18px"
                fontWeight="bold"
                cursor="pointer"
                pt="1v"
                px="1v"
              >
                Réseaux de chaleur classés
              </Text>
            </Box>

            <Box display="flex">
              <Box
                backgroundColor={themeDefHeatNetwork.outline.color}
                height="8px"
                minWidth="32px"
                borderRadius="4px"
                mt="1w"
              />

              <Box px="1v">
                <Text
                  as="label"
                  htmlFor="reseauxDeChaleur"
                  fontSize="14px"
                  lineHeight="18px"
                  fontWeight="bold"
                  cursor="pointer"
                >
                  Réseaux de chaleur non classés
                </Text>

                <Text fontSize="12px" lineHeight="14px">
                  (tracé ou cercle au centre de la commune si tracé non
                  disponible)
                </Text>
              </Box>
            </Box>
          </Box>

          <InfoIcon>
            <Icon size="1x" name="ri-information-fill" cursor="help" mr="1w" />

            <Hoverable position="bottom">
              Pour les réseaux classés, le raccordement des bâtiments neufs ou
              renouvelant leur installation de chauffage au-dessus d'une
              certaine puissance est obligatoire dès lors qu'ils sont situés
              dans le périmètre de développement prioritaire (sauf dérogation).
              <br />
              Les réseaux affichés comme classés sont ceux listés par arrêté du
              22 décembre 2023. Collectivités : pour signaler un dé-classement,
              cliquez sur Contribuer.
            </Hoverable>
          </InfoIcon>
        </Box>
      )}

      {enabledFeatures.includes('zonesDeDeveloppementPrioritaire') && (
        <Box display="flex">
          <SingleCheckbox
            id="zonesDeDeveloppementPrioritaire"
            checked={mapConfiguration.zonesDeDeveloppementPrioritaire}
            onChange={() => toggleLayer('zonesDeDeveloppementPrioritaire')}
            trackingEvent="Carto|Périmètres de développement prioritaire"
          />

          <Box
            backgroundColor={themeDefZoneDP.fill.color}
            opacity={themeDefZoneDP.fill.opacity}
            height="16px"
            minWidth="32px"
            mt="1v"
          />

          <Text
            as="label"
            htmlFor="zonesDeDeveloppementPrioritaire"
            fontSize="14px"
            lineHeight="18px"
            className="fr-col"
            fontWeight="bold"
            cursor="pointer"
            pt="1v"
            px="1v"
          >
            Périmètres de développement prioritaire des réseaux classés
          </Text>

          <InfoIcon>
            <Icon size="1x" name="ri-information-fill" cursor="help" mr="1w" />

            <Hoverable position="bottom">
              Dans cette zone, le raccordement des nouvelles constructions ou
              des bâtiments renouvelant leur installation de chauffage au-dessus
              d'une certaine puissance est obligatoire.
            </Hoverable>
          </InfoIcon>
        </Box>
      )}

      {enabledFeatures.includes('reseauxEnConstruction') && (
        <Box display="flex">
          <SingleCheckbox
            id="reseauxEnConstruction"
            checked={mapConfiguration.reseauxEnConstruction}
            onChange={() => toggleLayer('reseauxEnConstruction')}
            trackingEvent="Carto|Réseaux en construction"
          />

          <Box flex>
            <Box display="flex">
              <Box>
                <Box
                  backgroundColor={themeDefHeatNetwork.futur.color}
                  height="8px"
                  minWidth="32px"
                  borderRadius="4px"
                  mt="1w"
                />

                <Box
                  backgroundColor={themeDefHeatNetwork.futur.color}
                  opacity={themeDefHeatNetwork.futur.opacity}
                  height="16px"
                  minWidth="32px"
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
                  fontWeight="bold"
                  cursor="pointer"
                  pt="1v"
                >
                  Réseaux de chaleur en construction
                </Text>

                <Text fontSize="12px" lineHeight="14px">
                  (tracé ou zone si tracé non disponible)
                </Text>
              </Box>
            </Box>
          </Box>

          <InfoIcon>
            <Icon size="1x" name="ri-information-fill" cursor="help" mr="1w" />

            <Hoverable position="bottom">
              Projets financés par l'ADEME ou signalés par les collectivités et
              exploitants.
            </Hoverable>
          </InfoIcon>
        </Box>
      )}

      {enabledFeatures.includes('reseauxDeFroid') && (
        <Box display="flex">
          <SingleCheckbox
            id="reseauxDeFroid"
            checked={mapConfiguration.reseauxDeFroid}
            onChange={() => toggleLayer('reseauxDeFroid')}
            trackingEvent="Carto|Réseaux de froid"
          />

          <Box
            backgroundColor={themeDefHeatNetwork.cold.color}
            height="8px"
            minWidth="32px"
            borderRadius="4px"
            mt="1w"
          />

          <Box flex px="1v">
            <Text
              as="label"
              htmlFor="reseauxDeFroid"
              fontSize="14px"
              lineHeight="18px"
              fontWeight="bold"
              cursor="pointer"
            >
              Réseaux de froid
            </Text>
            <Text fontSize="12px" lineHeight="14px">
              (tracé ou cercle au centre de la commune si tracé non disponible)
            </Text>
          </Box>
        </Box>
      )}

      {enabledFeatures.includes('proModeLegend') && (
        <>
          <LegendSeparator />
          <Text
            fontSize="13px"
            lineHeight="18px"
            fontWeight="lightbold"
            fontStyle="italic"
            mt="2w"
            mx="2w"
          >
            Pour voir plus de données, contribuer à la carte ou télécharger les
            tracés, activez le "Mode professionnel" en haut de la carte.
          </Text>
        </>
      )}

      {enabledFeatures.includes('contributeButton') && (
        <>
          <Link
            variant="primary"
            href="/contribution"
            className="fr-btn--sm d-block"
            mx="auto"
            mt="1w"
          >
            <Icon name="ri-upload-2-line" size="lg" className="fr-mr-1w" />
            Contribuer
          </Link>
          <Link
            variant="primary"
            href="https://www.data.gouv.fr/fr/datasets/traces-des-reseaux-de-chaleur-et-de-froid/"
            isExternal
            eventKey="Téléchargement|Tracés|carte"
            className="fr-btn--sm d-block"
            mx="auto"
            mt="1w"
          >
            Télécharger les tracés
          </Link>
        </>
      )}

      {enabledFeatures.includes('demandesEligibilite') && (
        <>
          <LegendSeparator />

          <Box display="flex">
            <SingleCheckbox
              id="demandesEligibilite"
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
              fontWeight="bold"
              cursor="pointer"
              pt="1v"
              px="1v"
            >
              Demandes de raccordement sur France Chaleur Urbaine
            </Text>
          </Box>
        </>
      )}

      {enabledFeatures.includes('cartePotentielsRaccordements') && (
        <>
          <LegendSeparator />
          <Box textAlign="center">
            <PotentielsRaccordementButton
              secondary
              size="sm"
              className="fr-mx-auto"
              onClick={() => {
                trackEvent('Carto|ouverture popup potentiels de raccordement');
                setShowStatsModal(true);
              }}
            >
              <Image src="/img/icon-france.png" alt="" width="19" height="19" />
              Voir les potentiels de raccordement
            </PotentielsRaccordementButton>
          </Box>
          <ModalCarteFrance
            isOpen={showStatsModal}
            onClose={() => setShowStatsModal(false)}
          />
        </>
      )}

      {enabledFeatures.includes('consommationsGaz') && (
        <>
          <LegendSeparator />

          <Box display="flex">
            <SingleCheckbox
              id="consommationsGaz"
              checked={mapConfiguration.consommationsGaz.show}
              onChange={(checked) => {
                toggleLayer('consommationsGaz.show');
                if (checked) {
                  setSectionExpansion('consommationsGaz', true);
                }
              }}
              trackingEvent="Carto|Consommations globales de gaz"
            />

            <Box
              backgroundColor={consommationsGazLegendColor}
              opacity={consommationsGazUsageLegendOpacity}
              height="16px"
              width="16px"
              borderRadius="50%"
              mt="1v"
            />

            <Text
              as="label"
              htmlFor="consommationsGaz"
              fontSize="14px"
              lineHeight="18px"
              className="fr-col"
              fontWeight="bold"
              cursor="pointer"
              pt="1v"
              px="1v"
            >
              Consommations globales de gaz
            </Text>

            <Button
              className="fr-px-1w"
              hasBorder={false}
              size="sm"
              onClick={() => toggleSectionExpansion('consommationsGaz')}
              title="Afficher/Masquer le détail"
            >
              <Icon
                size="lg"
                name="ri-arrow-down-s-line"
                className="fr-mr-0"
                rotate={!!sectionsExpansions['consommationsGaz']}
              />
            </Button>
          </Box>

          <CollapsibleBox expand={!!sectionsExpansions['consommationsGaz']}>
            <DeactivatableBox
              disabled={!mapConfiguration.consommationsGaz.show}
            >
              <Box display="flex" flexWrap="wrap" px="3w">
                <Box display="flex">
                  <SingleCheckbox
                    id="consommationsGazLogements"
                    checked={mapConfiguration.consommationsGaz.logements}
                    onChange={() => toggleLayer('consommationsGaz.logements')}
                  />

                  <Box
                    backgroundColor={themeDefTypeGas.R.color}
                    height="10px"
                    width="10px"
                    borderRadius="50%"
                    mt="2v"
                  />

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
                    id="consommationsGazTertiaire"
                    checked={mapConfiguration.consommationsGaz.tertiaire}
                    onChange={() => toggleLayer('consommationsGaz.tertiaire')}
                  />

                  <Box
                    backgroundColor={themeDefTypeGas.T.color}
                    height="10px"
                    width="10px"
                    borderRadius="50%"
                    mt="2v"
                  />

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
                    id="consommationsGazIndustrie"
                    checked={mapConfiguration.consommationsGaz.industrie}
                    onChange={() => toggleLayer('consommationsGaz.industrie')}
                  />

                  <Box
                    backgroundColor={themeDefTypeGas.I.color}
                    height="10px"
                    width="10px"
                    borderRadius="50%"
                    mt="2v"
                  />

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
                defaultValues={
                  defaultMapConfiguration.consommationsGaz.interval
                }
                domain={[
                  LegendDeskData.gasUsage.min,
                  LegendDeskData.gasUsage.max,
                ]}
                onChange={(values) =>
                  updateScaleInterval('consommationsGaz.interval', values)
                }
              />
            </DeactivatableBox>
          </CollapsibleBox>
        </>
      )}

      {enabledFeatures.includes('batimentsGazCollectif') && (
        <>
          <LegendSeparator />

          <Box display="flex">
            <SingleCheckbox
              id="batimentsGazCollectif"
              checked={mapConfiguration.batimentsGazCollectif.show}
              onChange={(checked) => {
                toggleLayer('batimentsGazCollectif.show');
                if (checked) {
                  setSectionExpansion('batimentsGazCollectif', true);
                }
              }}
              trackingEvent="Carto|Bâtiments au gaz collectif"
            />

            <Box
              backgroundColor={themeDefEnergy.gas.color}
              opacity={energyLayerMaxOpacity}
              height="16px"
              width="16px"
              mt="1v"
            />

            <Text
              as="label"
              htmlFor="batimentsGazCollectif"
              fontSize="14px"
              lineHeight="18px"
              className="fr-col"
              fontWeight="bold"
              cursor="pointer"
              pt="1v"
              px="1v"
            >
              Bâtiments chauffés au gaz collectif
            </Text>

            <Button
              className="fr-px-1w"
              hasBorder={false}
              size="sm"
              onClick={() => toggleSectionExpansion('batimentsGazCollectif')}
              title="Afficher/Masquer le détail"
            >
              <Icon
                size="lg"
                name="ri-arrow-down-s-line"
                className="fr-mr-0"
                rotate={!!sectionsExpansions['batimentsGazCollectif']}
              />
            </Button>
          </Box>

          <CollapsibleBox
            expand={!!sectionsExpansions['batimentsGazCollectif']}
          >
            <DeactivatableBox
              disabled={!mapConfiguration.batimentsGazCollectif.show}
            >
              <ScaleLegend
                className="fr-ml-3w fr-mr-1w"
                label="Nombre de lots d'habitation"
                color={themeDefEnergy.gas.color}
                domain={[LegendDeskData.energy.min, LegendDeskData.energy.max]}
                defaultValues={
                  defaultMapConfiguration.batimentsGazCollectif.interval
                }
                onChange={(values) =>
                  updateScaleInterval('batimentsGazCollectif.interval', values)
                }
              />
            </DeactivatableBox>
          </CollapsibleBox>
        </>
      )}

      {enabledFeatures.includes('batimentsFioulCollectif') && (
        <>
          <LegendSeparator />

          <Box display="flex">
            <SingleCheckbox
              id="batimentsFioulCollectif"
              checked={mapConfiguration.batimentsFioulCollectif.show}
              onChange={(checked) => {
                toggleLayer('batimentsFioulCollectif.show');
                if (checked) {
                  setSectionExpansion('batimentsFioulCollectif', true);
                }
              }}
              trackingEvent="Carto|Bâtiments au fioul collectif"
            />

            <Box
              backgroundColor={themeDefEnergy.fuelOil.color}
              opacity={energyLayerMaxOpacity}
              height="16px"
              width="16px"
              mt="1v"
            />

            <Text
              as="label"
              htmlFor="batimentsFioulCollectif"
              fontSize="14px"
              lineHeight="18px"
              className="fr-col"
              fontWeight="bold"
              cursor="pointer"
              pt="1v"
              px="1v"
            >
              Bâtiments chauffés au fioul collectif
            </Text>

            <Button
              className="fr-px-1w"
              hasBorder={false}
              size="sm"
              onClick={() => toggleSectionExpansion('batimentsFioulCollectif')}
              title="Afficher/Masquer le détail"
            >
              <Icon
                size="lg"
                name="ri-arrow-down-s-line"
                className="fr-mr-0"
                rotate={!!sectionsExpansions['batimentsFioulCollectif']}
              />
            </Button>
          </Box>

          <CollapsibleBox
            expand={!!sectionsExpansions['batimentsFioulCollectif']}
          >
            <DeactivatableBox
              disabled={!mapConfiguration.batimentsFioulCollectif.show}
            >
              <ScaleLegend
                className="fr-ml-3w fr-mr-1w"
                label="Nombre de lots d'habitation"
                color={themeDefEnergy.fuelOil.color}
                domain={[LegendDeskData.energy.min, LegendDeskData.energy.max]}
                defaultValues={
                  defaultMapConfiguration.batimentsFioulCollectif.interval
                }
                onChange={(values) =>
                  updateScaleInterval(
                    'batimentsFioulCollectif.interval',
                    values
                  )
                }
              />
            </DeactivatableBox>
          </CollapsibleBox>
        </>
      )}

      {enabledFeatures.includes('batimentsRaccordes') && (
        <>
          <LegendSeparator />

          <Box display="flex">
            <SingleCheckbox
              id="batimentsRaccordes"
              checked={mapConfiguration.batimentsRaccordes}
              onChange={() => toggleLayer('batimentsRaccordes')}
              trackingEvent="Carto|Bâtiments raccordés"
            />

            <Box
              backgroundColor={themeDefHeatNetwork.classed.color}
              opacity={batimentsRaccordesLayerMaxOpacity}
              height="16px"
              width="16px"
              mt="1v"
            />

            <Text
              as="label"
              htmlFor="batimentsRaccordes"
              fontSize="14px"
              lineHeight="18px"
              className="fr-col"
              fontWeight="bold"
              cursor="pointer"
              pt="1v"
              px="1v"
            >
              Bâtiments raccordés à un réseau de chaleur
            </Text>
          </Box>
        </>
      )}

      {enabledFeatures.includes('zonesOpportunite') && (
        <>
          <LegendSeparator />

          <Box display="flex">
            <SingleCheckbox
              id="zonesOpportunite"
              checked={mapConfiguration.zonesOpportunite.show}
              onChange={(checked) => {
                toggleLayer('zonesOpportunite.show');
                if (checked) {
                  setSectionExpansion('zonesOpportunite', true);
                }
              }}
              trackingEvent="Carto|Zones d'opportunité"
            />

            <IconPolygon
              stroke={themeDefZonePotentielFortChaud.fill.color}
              fillOpacity={themeDefZonePotentielFortChaud.fill.opacity}
              mt="1v"
            />

            <Text
              as="label"
              htmlFor="zonesOpportunite"
              fontSize="14px"
              lineHeight="18px"
              className="fr-col"
              fontWeight="bold"
              cursor="pointer"
              pt="1v"
              px="1v"
            >
              Zones d'opportunité pour la création de réseaux de chaleur
            </Text>

            <InfoIcon>
              <Icon size="1x" name="ri-information-fill" cursor="help" />

              <Hoverable position="bottom">
                Modélisation réalisée par le Cerema dans le cadre du projet
                EnRezo.
                <br />
                <Link
                  href="https://reseaux-chaleur.cerema.fr/sites/reseaux-chaleur-v2/files/fichiers/2024/01/Methodologie_zones_opportunite_VF.pdf"
                  isExternal
                >
                  Accéder à la méthodologie
                </Link>
              </Hoverable>
            </InfoIcon>

            <Button
              className="fr-px-1w"
              hasBorder={false}
              size="sm"
              onClick={() => toggleSectionExpansion('zonesOpportunite')}
              title="Afficher/Masquer le détail"
            >
              <Icon
                size="lg"
                name="ri-arrow-down-s-line"
                className="fr-mr-0"
                rotate={!!sectionsExpansions['zonesOpportunite']}
              />
            </Button>
          </Box>

          <CollapsibleBox expand={!!sectionsExpansions['zonesOpportunite']}>
            <DeactivatableBox
              disabled={!mapConfiguration.zonesOpportunite.show}
              display="flex"
              flexWrap="wrap"
              ml="3w"
              mr="1w"
            >
              <Box display="flex">
                <SingleCheckbox
                  id="zonesPotentielChaud"
                  checked={
                    mapConfiguration.zonesOpportunite.zonesPotentielChaud
                  }
                  onChange={() =>
                    toggleLayer('zonesOpportunite.zonesPotentielChaud')
                  }
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
                  id="zonesPotentielFortChaud"
                  checked={
                    mapConfiguration.zonesOpportunite.zonesPotentielFortChaud
                  }
                  onChange={() =>
                    toggleLayer('zonesOpportunite.zonesPotentielFortChaud')
                  }
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
          </CollapsibleBox>
        </>
      )}

      {enabledFeatures.includes('enrrMobilisables') && (
        <>
          <LegendSeparator />

          <Box display="flex">
            <SingleCheckbox
              id="enrrMobilisables"
              checked={mapConfiguration.enrrMobilisables.show}
              onChange={(checked) => {
                toggleLayer('enrrMobilisables.show');
                if (checked) {
                  setSectionExpansion('enrrMobilisables', true);
                }
              }}
              trackingEvent="Carto|ENR&R Mobilisables"
            />

            <Text
              as="label"
              htmlFor="enrrMobilisables"
              fontSize="14px"
              lineHeight="18px"
              className="fr-col"
              fontWeight="bold"
              cursor="pointer"
              pt="1v"
              px="1v"
            >
              ENR&R mobilisables
            </Text>

            <InfoIcon>
              <Icon size="1x" name="ri-information-fill" cursor="help" />

              <Hoverable position="bottom">
                Données du projet{' '}
                <Link
                  href="https://reseaux-chaleur.cerema.fr/espace-documentaire/enrezo"
                  isExternal
                >
                  EnRezo
                </Link>{' '}
                du Cerema.
              </Hoverable>
            </InfoIcon>

            <Button
              className="fr-px-1w"
              hasBorder={false}
              size="sm"
              onClick={() => toggleSectionExpansion('enrrMobilisables')}
              title="Afficher/Masquer le détail"
            >
              <Icon
                size="lg"
                name="ri-arrow-down-s-line"
                className="fr-mr-0"
                rotate={!!sectionsExpansions['enrrMobilisables']}
              />
            </Button>
          </Box>

          <CollapsibleBox expand={!!sectionsExpansions['enrrMobilisables']}>
            <DeactivatableBox
              disabled={!mapConfiguration.enrrMobilisables.show}
              ml="3w"
              mr="1w"
            >
              <Box display="flex">
                <SingleCheckbox
                  id="showUnitesDIncineration"
                  checked={
                    mapConfiguration.enrrMobilisables.showUnitesDIncineration
                  }
                  onChange={() =>
                    toggleLayer('enrrMobilisables.showUnitesDIncineration')
                  }
                  trackingEvent="Carto|Unités d'incinération"
                />

                <Image
                  src="/icons/enrr_mobilisables_unites_incineration.png"
                  alt=""
                  height="16"
                  width="16"
                  className="fr-mt-1v"
                />

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
                  id="showIndustrie"
                  checked={mapConfiguration.enrrMobilisables.showIndustrie}
                  onChange={() => toggleLayer('enrrMobilisables.showIndustrie')}
                  trackingEvent="Carto|Industrie"
                />

                <Image
                  src="/icons/enrr_mobilisables_industrie.png"
                  alt=""
                  height="16"
                  width="16"
                  className="fr-mt-1v"
                />

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
                  id="showStationsDEpuration"
                  checked={
                    mapConfiguration.enrrMobilisables.showStationsDEpuration
                  }
                  onChange={() =>
                    toggleLayer('enrrMobilisables.showStationsDEpuration')
                  }
                  trackingEvent="Carto|Stations d'épuration"
                />

                <Image
                  src="/icons/enrr_mobilisables_stations_epuration.png"
                  alt=""
                  height="16"
                  width="16"
                  className="fr-mt-1v"
                />

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
                  id="showDatacenters"
                  checked={mapConfiguration.enrrMobilisables.showDatacenters}
                  onChange={() =>
                    toggleLayer('enrrMobilisables.showDatacenters')
                  }
                  trackingEvent="Carto|Datacenters"
                />

                <Image
                  src="/icons/enrr_mobilisables_datacenter.png"
                  alt=""
                  height="16"
                  width="16"
                  className="fr-mt-1v"
                />

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
                  id="showInstallationsElectrogenes"
                  checked={
                    mapConfiguration.enrrMobilisables
                      .showInstallationsElectrogenes
                  }
                  onChange={() =>
                    toggleLayer(
                      'enrrMobilisables.showInstallationsElectrogenes'
                    )
                  }
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

              <Box display="flex">
                <SingleCheckbox
                  id="friches"
                  checked={
                    mapConfiguration.enrrMobilisables
                      .showSolaireThermiqueFriches
                  }
                  onChange={() =>
                    toggleLayer('enrrMobilisables.showSolaireThermiqueFriches')
                  }
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
                  Solaire thermique - friches
                </Text>
              </Box>

              <Box display="flex">
                <SingleCheckbox
                  id="parkings"
                  checked={
                    mapConfiguration.enrrMobilisables
                      .showSolaireThermiqueParkings
                  }
                  onChange={() =>
                    toggleLayer('enrrMobilisables.showSolaireThermiqueParkings')
                  }
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
                  Solaire thermique - parkings
                </Text>
              </Box>
            </DeactivatableBox>
          </CollapsibleBox>
        </>
      )}

      {enabledFeatures.includes('caracteristiquesBatiments') && (
        <>
          <LegendSeparator />

          <Box display="flex">
            <SingleCheckbox
              id="caracteristiquesBatiments"
              checked={mapConfiguration.caracteristiquesBatiments}
              onChange={(checked) => {
                toggleLayer('caracteristiquesBatiments');
                if (checked) {
                  setSectionExpansion('caracteristiquesBatiments', true);
                }
              }}
              trackingEvent="Carto|DPE"
            />

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

            <Text
              as="label"
              htmlFor="caracteristiquesBatiments"
              fontSize="14px"
              lineHeight="18px"
              className="fr-col"
              fontWeight="bold"
              cursor="pointer"
              pt="1v"
              px="1v"
            >
              Caractéristiques des bâtiments
            </Text>

            <InfoIcon>
              <Icon size="1x" name="ri-information-fill" cursor="help" />

              <Hoverable position="bottom">
                Les DPE affichés par bâtiment résultent d'un extrapolation des
                DPE par logement ancienne définition. Ils sont donnés à titre
                informatif et non-officiel, sans aucune valeur légale.
              </Hoverable>
            </InfoIcon>

            <Button
              className="fr-px-1w"
              hasBorder={false}
              size="sm"
              onClick={() =>
                toggleSectionExpansion('caracteristiquesBatiments')
              }
              title="Afficher/Masquer le détail"
            >
              <Icon
                size="lg"
                name="ri-arrow-down-s-line"
                className="fr-mr-0"
                rotate={!!sectionsExpansions['caracteristiquesBatiments']}
              />
            </Button>
          </Box>

          <CollapsibleBox
            expand={!!sectionsExpansions['caracteristiquesBatiments']}
          >
            <DeactivatableBox
              disabled={!mapConfiguration.caracteristiquesBatiments}
              ml="3w"
              mr="1w"
            >
              <Text
                fontSize="13px"
                lineHeight="18px"
                fontWeight="lightbold"
                fontStyle="italic"
              >
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
          </CollapsibleBox>
        </>
      )}

      {enabledFeatures.includes('sources') && (
        <>
          <LegendSeparator />
          <Box
            mt="n2w"
            mx="2w"
            mb="2w"
            display="flex"
            alignItems="center"
            gap="16px"
          >
            <Link
              href="/documentation/carto_sources.pdf"
              isExternal
              eventKey="Téléchargement|Carto sources"
            >
              <Text as="span" size="xs">
                Sources
              </Text>
            </Link>
            <DevModeIcon />
          </Box>
        </>
      )}
    </>
  );
}

export default SimpleMapLegend;
