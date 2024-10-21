import { parseAsBoolean, useQueryState } from 'nuqs';

import SelectCheckboxes from '@components/form/dsfr/SelectCheckboxes';
import RangeFilter from '@components/Map/components/RangeFilter';
import useFCUMap from '@components/Map/MapProvider';
import { UrlStateAccordion } from '@components/ui/Accordion';
import Button from '@components/ui/Button';
import Divider from '@components/ui/Divider';
import { deepMergeObjects } from '@utils/core';
import { emptyMapConfiguration, filtresEnergies, percentageMaxInterval } from 'src/services/Map/map-configuration';

import { DeactivatableBox, FilterResetButtonWrapper } from './SimpleMapLegend.style';

function ReseauxDeChaleurFilters() {
  const { mapConfiguration, setMapConfiguration, updateScaleInterval } = useFCUMap();

  const [isFiltering, toggleFiltering] = useQueryState('rdc_isfiltering', parseAsBoolean.withDefault(false));

  const filterAndUpdateScaleInterval: typeof updateScaleInterval = (property) => {
    toggleFiltering(true);
    return updateScaleInterval(property);
  };

  const resetFilters = () => {
    setMapConfiguration(
      deepMergeObjects(mapConfiguration, {
        reseauxDeChaleur: {
          ...filtresEnergies.reduce(
            (acc, filtreEnergie) => ({
              ...acc,
              [`energie_ratio_${filtreEnergie.confKey}`]: emptyMapConfiguration.reseauxDeChaleur[`energie_ratio_${filtreEnergie.confKey}`],
            }),
            {}
          ),
          energieMobilisee: [],
          ...mapConfiguration.reseauxDeChaleur.limits,
        },
      })
    );
    toggleFiltering(false);
  };

  return (
    <DeactivatableBox disabled={!mapConfiguration.reseauxDeChaleur.show}>
      <SelectCheckboxes
        small
        label="Énergies mobilisées (au sein d'un même réseau)"
        className="fr-mb-1v"
        options={filtresEnergies.reduce(
          (acc, { label, confKey }) => {
            acc.push({
              label,
              nativeInputProps: {
                checked: mapConfiguration.reseauxDeChaleur.energieMobilisee?.includes(confKey) || false,
                onChange: () => {
                  const currentEnergies = mapConfiguration.reseauxDeChaleur.energieMobilisee || [];

                  const newEnergies = currentEnergies.includes(confKey)
                    ? currentEnergies.filter((key) => key !== confKey) // Remove if already selected
                    : [...currentEnergies, confKey]; // Add if not selected

                  mapConfiguration.reseauxDeChaleur.energieMobilisee = newEnergies.length ? newEnergies : undefined;

                  toggleFiltering(true);
                  setMapConfiguration({ ...mapConfiguration });
                },
              },
            });
            return acc;
          },
          [] as Array<{ label: string; nativeInputProps: { checked: boolean; onChange: () => void } }>
        )}
      />
      <UrlStateAccordion
        queryParamName="rdc_filter_more_options"
        multi={false}
        label="Plus d'options"
        style={{ margin: '0.25rem 0' }}
        simple
        small
      >
        <DeactivatableBox disabled={!mapConfiguration.reseauxDeChaleur.show}>
          {filtresEnergies.map((filtreEnergie) => (
            <RangeFilter
              key={filtreEnergie.confKey}
              label={filtreEnergie.label}
              domain={percentageMaxInterval}
              value={mapConfiguration.reseauxDeChaleur[`energie_ratio_${filtreEnergie.confKey}`]}
              onChange={(interval) => filterAndUpdateScaleInterval(`reseauxDeChaleur.energie_ratio_${filtreEnergie.confKey}`)(interval)}
              unit="%"
            />
          ))}
        </DeactivatableBox>
      </UrlStateAccordion>
      <Divider />

      <RangeFilter
        label="Taux d’EnR&R"
        domain={percentageMaxInterval}
        value={mapConfiguration.reseauxDeChaleur.tauxENRR}
        onChange={(interval) => filterAndUpdateScaleInterval('reseauxDeChaleur.tauxENRR')(interval)}
        unit="%"
      />
      <Divider />
      <RangeFilter
        label="Émissions de CO2"
        domain={mapConfiguration.reseauxDeChaleur.limits.emissionsCO2}
        value={mapConfiguration.reseauxDeChaleur.emissionsCO2}
        onChange={(interval) => filterAndUpdateScaleInterval('reseauxDeChaleur.emissionsCO2')(interval)}
        unit="gCO2/kWh"
        tooltip="Émissions en analyse du cycle de vie (directes et indirectes)"
      />
      <Divider />
      <RangeFilter
        label="Prix moyen de la chaleur"
        domain={mapConfiguration.reseauxDeChaleur.limits.prixMoyen}
        value={mapConfiguration.reseauxDeChaleur.prixMoyen}
        onChange={(interval) => filterAndUpdateScaleInterval('reseauxDeChaleur.prixMoyen')(interval)}
        unit="€TTC/MWh"
        tooltip="La comparaison avec le prix d'autres modes de chauffage n’est pertinente qu’en coût global annuel, en intégrant les coûts d’exploitation, de maintenance et d’investissement, amortis sur la durée de vie des installations."
      />
      <Divider />
      <RangeFilter
        label="Livraisons annuelles de chaleur"
        domain={mapConfiguration.reseauxDeChaleur.limits.livraisonsAnnuelles}
        value={mapConfiguration.reseauxDeChaleur.livraisonsAnnuelles}
        onChange={(interval) => filterAndUpdateScaleInterval('reseauxDeChaleur.livraisonsAnnuelles')(interval)}
        domainTransform={{
          percentToValue: (v) => roundNumberProgressively(getLivraisonsAnnuellesFromPercentage(v)),
          valueToPercent: (v) => roundNumberProgressively(getPercentageFromLivraisonsAnnuelles(v)),
        }}
        unit="GWh"
      />
      <Divider />
      <RangeFilter
        label="Année de construction"
        domain={mapConfiguration.reseauxDeChaleur.limits.anneeConstruction}
        value={mapConfiguration.reseauxDeChaleur.anneeConstruction}
        onChange={(interval) => filterAndUpdateScaleInterval('reseauxDeChaleur.anneeConstruction')(interval)}
      />
      {isFiltering && (
        <FilterResetButtonWrapper>
          <Button type="button" onClick={resetFilters} priority="secondary" size="small" iconId="fr-icon-arrow-go-back-line" full>
            Réinitialiser les filtres
          </Button>
        </FilterResetButtonWrapper>
      )}
    </DeactivatableBox>
  );
}

export default ReseauxDeChaleurFilters;

export function getLivraisonsAnnuellesFromPercentage(v: number): number {
  if (v < 25) {
    return 0.06 * v;
  }
  if (v < 50) {
    return 0.54 * v - 12;
  }
  if (v < 75) {
    return 3.4 * v - 155;
  }
  return 149.48 * v - 11111;
}

export function getPercentageFromLivraisonsAnnuelles(v: number): number {
  if (v < 1.5) {
    return v / 0.06;
  }
  if (v < 15) {
    return (v + 12) / 0.54;
  }
  if (v < 100) {
    return (v + 155) / 3.4;
  }
  return (v + 11111) / 149.48;
}

export function roundNumberProgressively(v: number): number {
  return v > 2 ? Math.round(v) : v > 1 ? Math.round(v * 10) / 10 : Math.round(v * 100) / 100;
}
