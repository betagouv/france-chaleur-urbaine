import { useRouter } from 'next/navigation';

import RangeFilter, { roundNumberProgressively } from '@components/form/dsfr/RangeFilter';
import SelectCheckboxes from '@components/form/dsfr/SelectCheckboxes';
import useFCUMap from '@components/Map/MapProvider';
import { UrlStateAccordion } from '@components/ui/Accordion';
import Button from '@components/ui/Button';
import Divider from '@components/ui/Divider';
import { filtresEnergies, percentageMaxInterval } from 'src/services/Map/map-configuration';

import { DeactivatableBox, FilterResetButtonWrapper } from './SimpleMapLegend.style';

function ReseauxDeChaleurFilters() {
  const { mapConfiguration, resetFilters, updateFilter, countFilters, filtersQueryParam } = useFCUMap();
  const nbFilters = countFilters('reseauxDeChaleur');
  const router = useRouter();

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

                  updateFilter('reseauxDeChaleur.energieMobilisee', newEnergies.length ? newEnergies : undefined);
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
              small
              label={filtreEnergie.label}
              domain={percentageMaxInterval}
              value={mapConfiguration.reseauxDeChaleur[`energie_ratio_${filtreEnergie.confKey}`]}
              onChange={(interval) => updateFilter(`reseauxDeChaleur.energie_ratio_${filtreEnergie.confKey}`, interval)}
              unit="%"
            />
          ))}
        </DeactivatableBox>
      </UrlStateAccordion>
      <Divider />

      <RangeFilter
        label="Taux d’EnR&R"
        small
        domain={percentageMaxInterval}
        value={mapConfiguration.reseauxDeChaleur.tauxENRR}
        onChange={(interval) => updateFilter('reseauxDeChaleur.tauxENRR', interval)}
        unit="%"
      />
      <Divider />
      <RangeFilter
        label="Émissions de CO2"
        small
        domain={mapConfiguration.reseauxDeChaleur.limits.emissionsCO2}
        value={mapConfiguration.reseauxDeChaleur.emissionsCO2}
        onChange={(interval) => updateFilter('reseauxDeChaleur.emissionsCO2', interval)}
        unit="gCO2/kWh"
        tooltip="Émissions en analyse du cycle de vie (directes et indirectes)"
      />
      <Divider />
      <RangeFilter
        label="Prix moyen de la chaleur"
        small
        domain={mapConfiguration.reseauxDeChaleur.limits.prixMoyen}
        value={mapConfiguration.reseauxDeChaleur.prixMoyen}
        onChange={(interval) => updateFilter('reseauxDeChaleur.prixMoyen', interval)}
        unit="€TTC/MWh"
        tooltip="La comparaison avec le prix d'autres modes de chauffage n’est pertinente qu’en coût global annuel, en intégrant les coûts d’exploitation, de maintenance et d’investissement, amortis sur la durée de vie des installations."
      />
      <Divider />
      <RangeFilter
        label="Livraisons annuelles de chaleur"
        small
        domain={mapConfiguration.reseauxDeChaleur.limits.livraisonsAnnuelles}
        value={mapConfiguration.reseauxDeChaleur.livraisonsAnnuelles}
        onChange={(interval) => updateFilter('reseauxDeChaleur.livraisonsAnnuelles', interval)}
        domainTransform={{
          percentToValue: (v) => roundNumberProgressively(getLivraisonsAnnuellesFromPercentage(v)),
          valueToPercent: (v) => roundNumberProgressively(getPercentageFromLivraisonsAnnuelles(v)),
        }}
        unit="GWh"
      />
      <Divider />
      <RangeFilter
        label="Année de construction"
        small
        domain={mapConfiguration.reseauxDeChaleur.limits.anneeConstruction}
        value={mapConfiguration.reseauxDeChaleur.anneeConstruction}
        onChange={(interval) => updateFilter('reseauxDeChaleur.anneeConstruction', interval)}
      />
      <FilterResetButtonWrapper>
        {nbFilters > 0 && (
          <Button type="button" onClick={resetFilters} priority="secondary" size="small" iconId="fr-icon-arrow-go-back-line" full>
            Réinitialiser les filtres
          </Button>
        )}
        <Button
          type="button"
          onClick={() => router.push(`/reseaux?rdc_filters=${filtersQueryParam}`)}
          priority="tertiary"
          size="small"
          iconId="fr-icon-arrow-go-forward-line"
          full
          iconPosition="right"
        >
          Voir la liste
        </Button>
      </FilterResetButtonWrapper>
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
