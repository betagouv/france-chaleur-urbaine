import { fr } from '@codegouvfr/react-dsfr';
import { useRouter } from 'next/navigation';
import React from 'react';
import styled from 'styled-components';

import Checkboxes from '@/components/form/dsfr/Checkboxes';
import RangeFilter, { roundNumberProgressively } from '@/components/form/dsfr/RangeFilter';
import SelectCheckboxes from '@/components/form/dsfr/SelectCheckboxes';
import { filtresEnergies } from '@/components/Map/map-configuration';
import { UrlStateAccordion } from '@/components/ui/Accordion';
import Button from '@/components/ui/Button';
import useReseauxDeChaleurFilters from '@/hooks/useReseauxDeChaleurFilters';
import { gestionnairesFilters } from '@/services';

export type ReseauxDeChaleurFiltersProps = React.HTMLAttributes<HTMLDivElement> & {
  regionsList?: { name: string; coord: string }[];
  linkTo: 'map' | 'list';
};

const bestZoomForRegions = 7;

export const FilterResetButtonWrapper = styled.div`
  position: sticky;
  bottom: -1rem; /* to prevent scroll to be visible at the very bottom */
  background: white;
  z-index: 1;
  padding: 1rem 0;
  display: flex;
  gap: 8px;
  flex-direction: column;
`;

const ReseauxDeChaleurFilters: React.FC<ReseauxDeChaleurFiltersProps> = ({ regionsList, linkTo }) => {
  const { filters, limits, updateFilter, nbFilters, resetFilters, filtersQueryParam, loading } = useReseauxDeChaleurFilters();
  const router = useRouter();

  return (
    <>
      <Checkboxes
        small
        fullWidth={false}
        options={[
          {
            label: 'Réseaux classés',
            nativeInputProps: {
              checked: filters.isClassed,
              onChange: (e) => updateFilter('isClassed', e.target.checked),
            },
          },
        ]}
      />
      <SelectCheckboxes
        small
        label="Énergies mobilisées (au sein d'un même réseau)"
        className="fr-mb-1v"
        options={filtresEnergies.reduce(
          (acc, { label, confKey }) => {
            acc.push({
              label,
              nativeInputProps: {
                checked: filters.energieMobilisee.includes(confKey),
                onChange: () => {
                  const currentItems = filters.energieMobilisee;

                  const newItems = currentItems.includes(confKey)
                    ? currentItems.filter((key) => key !== confKey) // Remove if already selected
                    : [...currentItems, confKey]; // Add if not selected

                  updateFilter('energieMobilisee', newItems.length ? newItems : undefined);
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
        {filtresEnergies.map((filtreEnergie, index) => (
          <RangeFilter
            loading={loading}
            small
            key={filtreEnergie.confKey}
            label={filtreEnergie.label}
            domain={limits[`energie_ratio_${filtreEnergie.confKey}`]}
            value={filters[`energie_ratio_${filtreEnergie.confKey}`]}
            onChange={(interval) => updateFilter(`energie_ratio_${filtreEnergie.confKey}`, interval)}
            unit="%"
            className={fr.cx(index > 0 ? 'fr-mt-2w' : null)}
          />
        ))}
      </UrlStateAccordion>
      {regionsList && (
        <>
          <br />
          <SelectCheckboxes
            small
            label="Régions"
            className="fr-mb-1v"
            options={regionsList
              .map(({ name }) => name)
              .reduce(
                (acc, regionName) => {
                  acc.push({
                    label: regionName,
                    nativeInputProps: {
                      checked: filters.regions.includes(regionName),
                      onChange: () => {
                        const currentItems = filters.regions;

                        const newItems = currentItems.includes(regionName)
                          ? currentItems.filter((key) => key !== regionName) // Remove if already selected
                          : [...currentItems, regionName]; // Add if not selected

                        updateFilter('regions', newItems.length ? newItems : undefined);
                      },
                    },
                  });
                  return acc;
                },
                [] as Array<{ label: string; nativeInputProps: { checked: boolean; onChange: () => void } }>
              )}
          />
        </>
      )}
      {gestionnairesFilters && (
        <>
          <br />
          <SelectCheckboxes
            small
            label="Gestionnaires"
            className="fr-mb-1v"
            options={gestionnairesFilters.reduce(
              (acc, { label, value }) => {
                acc.push({
                  label,
                  nativeInputProps: {
                    checked: filters.gestionnaires.includes(value),
                    onChange: () => {
                      const currentItems = filters.gestionnaires;

                      const newItems = currentItems.includes(value)
                        ? currentItems.filter((key) => key !== value) // Remove if already selected
                        : [...currentItems, value]; // Add if not selected

                      updateFilter('gestionnaires', newItems.length ? newItems : undefined);
                    },
                  },
                });
                return acc;
              },
              [] as Array<{ label: string; nativeInputProps: { checked: boolean; onChange: () => void } }>
            )}
          />
        </>
      )}
      <br />
      <RangeFilter
        loading={loading}
        small
        label="Taux d’EnR&R"
        domain={limits.tauxENRR}
        value={filters.tauxENRR}
        onChange={(interval) => updateFilter('tauxENRR', interval)}
        unit="%"
      />
      <br />
      <RangeFilter
        loading={loading}
        small
        label="Contenu CO2 ACV"
        domain={limits.emissionsCO2}
        value={filters.emissionsCO2}
        onChange={(interval) => updateFilter('emissionsCO2', interval)}
        unit="gCO2/kWh"
        tooltip="Émissions en analyse du cycle de vie (directes et indirectes)"
      />
      <br />
      <RangeFilter
        loading={loading}
        small
        label="Contenu CO2"
        domain={limits.contenuCO2}
        value={filters.contenuCO2}
        onChange={(interval) => updateFilter('contenuCO2', interval)}
        unit="gCO2/kWh"
        tooltip="Émissions en analyse du cycle de vie (directes et indirectes)"
      />
      <br />
      <RangeFilter
        loading={loading}
        small
        label="Prix moyen de la chaleur"
        domain={limits.prixMoyen}
        value={filters.prixMoyen}
        onChange={(interval) => updateFilter('prixMoyen', interval)}
        unit="€TTC/MWh"
        tooltip="La comparaison avec le prix d'autres modes de chauffage n’est pertinente qu’en coût global annuel, en intégrant les coûts d’exploitation, de maintenance et d’investissement, amortis sur la durée de vie des installations."
      />
      <br />
      <RangeFilter
        loading={loading}
        small
        label="Livraisons annuelles de chaleur"
        domain={limits.livraisonsAnnuelles}
        value={filters.livraisonsAnnuelles}
        onChange={(interval) => updateFilter('livraisonsAnnuelles', interval)}
        domainTransform={{
          percentToValue: (v) => roundNumberProgressively(getLivraisonsAnnuellesFromPercentage(v)),
          valueToPercent: (v) => roundNumberProgressively(getPercentageFromLivraisonsAnnuelles(v)),
        }}
        unit="GWh"
      />
      <br />
      <RangeFilter
        loading={loading}
        small
        label="Année de construction"
        domain={limits.anneeConstruction}
        value={filters.anneeConstruction}
        onChange={(interval) => updateFilter('anneeConstruction', interval)}
      />
      <FilterResetButtonWrapper>
        {nbFilters > 0 && (
          <Button type="button" onClick={resetFilters} priority="secondary" size="small" iconId="fr-icon-arrow-go-back-line" full>
            Réinitialiser les filtres
          </Button>
        )}
        {linkTo === 'map' ? (
          <Button
            type="button"
            onClick={() =>
              router.push(
                `/carte?rdc_filters=${filtersQueryParam}&tabId=reseaux/filtres${
                  filters.regions.length && regionsList
                    ? `&zoom=${bestZoomForRegions}&coord=` + regionsList.find(({ name }) => name === filters.regions[0])?.coord
                    : ''
                }`
              )
            }
            priority="tertiary"
            size="small"
            iconId="fr-icon-arrow-right-line"
            full
            iconPosition="right"
          >
            Voir la carte
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => router.push(`/reseaux?rdc_filters=${filtersQueryParam}`)}
            priority="tertiary"
            size="small"
            iconId="fr-icon-arrow-right-line"
            full
            iconPosition="right"
          >
            Voir la liste
          </Button>
        )}
      </FilterResetButtonWrapper>
    </>
  );
};

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
