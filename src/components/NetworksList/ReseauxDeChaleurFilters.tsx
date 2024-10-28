import { useRouter } from 'next/navigation';
import React from 'react';
import styled from 'styled-components';

import Checkbox from '@components/form/dsfr/Checkbox';
import RangeFilter, { roundNumberProgressively } from '@components/form/dsfr/RangeFilter';
import SelectCheckboxes from '@components/form/dsfr/SelectCheckboxes';
import {
  getLivraisonsAnnuellesFromPercentage,
  getPercentageFromLivraisonsAnnuelles,
} from '@components/Map/components/ReseauxDeChaleurFilters';
import { UrlStateAccordion } from '@components/ui/Accordion';
import Button from '@components/ui/Button';
import useReseauxDeChaleurFilters, { gestionnairesFilters } from '@hooks/useReseauxDeChaleurFilters';
import { filtresEnergies } from 'src/services/Map/map-configuration';

type ReseauxDeChaleurFiltersProps = React.HTMLAttributes<HTMLDivElement> & {
  regionsList: string[];
};
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

const ReseauxDeChaleurFilters: React.FC<ReseauxDeChaleurFiltersProps> = ({ regionsList }) => {
  const { filters, limits, updateFilter, nbFilters, resetFilters, filtersQueryParam } = useReseauxDeChaleurFilters();
  const router = useRouter();

  return (
    <>
      <Checkbox
        small
        options={[
          {
            label: 'Réseaux classés',
            nativeInputProps: {
              checked: filters?.reseauxDeChaleur?.isClassed,
              onChange: (e) => updateFilter('reseauxDeChaleur.isClassed', e.target.checked),
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
                checked: filters?.reseauxDeChaleur?.energieMobilisee?.includes(confKey) || false,
                onChange: () => {
                  const currentItems = filters?.reseauxDeChaleur?.energieMobilisee || [];

                  const newItems = currentItems.includes(confKey)
                    ? currentItems.filter((key) => key !== confKey) // Remove if already selected
                    : [...currentItems, confKey]; // Add if not selected

                  updateFilter('reseauxDeChaleur.energieMobilisee', newItems.length ? newItems : undefined);
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
        {filtresEnergies.map((filtreEnergie) => (
          <RangeFilter
            key={filtreEnergie.confKey}
            label={filtreEnergie.label}
            domain={limits.reseauxDeChaleur[`energie_ratio_${filtreEnergie.confKey}`]}
            value={filters?.reseauxDeChaleur?.[`energie_ratio_${filtreEnergie.confKey}`]}
            onChange={(interval) => updateFilter(`reseauxDeChaleur.energie_ratio_${filtreEnergie.confKey}`, interval)}
            unit="%"
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
            options={regionsList.reduce(
              (acc, regionName) => {
                acc.push({
                  label: regionName,
                  nativeInputProps: {
                    checked: filters?.reseauxDeChaleur?.regions?.includes(regionName) || false,
                    onChange: () => {
                      const currentItems = filters?.reseauxDeChaleur?.regions || [];

                      const newItems = currentItems.includes(regionName)
                        ? currentItems.filter((key) => key !== regionName) // Remove if already selected
                        : [...currentItems, regionName]; // Add if not selected

                      updateFilter('reseauxDeChaleur.regions', newItems.length ? newItems : undefined);
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
                    checked: filters?.reseauxDeChaleur?.gestionnaires?.includes(value) || false,
                    onChange: () => {
                      const currentItems = filters?.reseauxDeChaleur?.gestionnaires || [];

                      const newItems = currentItems.includes(value)
                        ? currentItems.filter((key) => key !== value) // Remove if already selected
                        : [...currentItems, value]; // Add if not selected

                      updateFilter('reseauxDeChaleur.gestionnaires', newItems.length ? newItems : undefined);
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
        label="Taux d’EnR&R"
        domain={limits.reseauxDeChaleur.tauxENRR}
        value={filters?.reseauxDeChaleur?.tauxENRR}
        onChange={(interval) => updateFilter('reseauxDeChaleur.tauxENRR', interval)}
        unit="%"
      />
      <br />
      <RangeFilter
        label="Contenu CO2 ACV"
        domain={limits.reseauxDeChaleur.emissionsCO2}
        value={filters?.reseauxDeChaleur?.emissionsCO2}
        onChange={(interval) => updateFilter('reseauxDeChaleur.emissionsCO2', interval)}
        unit="gCO2/kWh"
        tooltip="Émissions en analyse du cycle de vie (directes et indirectes)"
      />
      <br />
      <RangeFilter
        label="Contenu CO2"
        domain={limits.reseauxDeChaleur.contenuCO2}
        value={filters?.reseauxDeChaleur?.contenuCO2}
        onChange={(interval) => updateFilter('reseauxDeChaleur.contenuCO2', interval)}
        unit="gCO2/kWh"
        tooltip="Émissions en analyse du cycle de vie (directes et indirectes)"
      />
      <br />
      <RangeFilter
        label="Prix moyen de la chaleur"
        domain={limits.reseauxDeChaleur.prixMoyen}
        value={filters?.reseauxDeChaleur?.prixMoyen}
        onChange={(interval) => updateFilter('reseauxDeChaleur.prixMoyen', interval)}
        unit="€TTC/MWh"
        tooltip="La comparaison avec le prix d'autres modes de chauffage n’est pertinente qu’en coût global annuel, en intégrant les coûts d’exploitation, de maintenance et d’investissement, amortis sur la durée de vie des installations."
      />
      <br />
      <RangeFilter
        label="Livraisons annuelles de chaleur"
        domain={limits.reseauxDeChaleur.livraisonsAnnuelles}
        value={filters?.reseauxDeChaleur?.livraisonsAnnuelles}
        onChange={(interval) => updateFilter('reseauxDeChaleur.livraisonsAnnuelles', interval)}
        domainTransform={{
          percentToValue: (v) => roundNumberProgressively(getLivraisonsAnnuellesFromPercentage(v)),
          valueToPercent: (v) => roundNumberProgressively(getPercentageFromLivraisonsAnnuelles(v)),
        }}
        unit="GWh"
      />
      <br />
      <RangeFilter
        label="Année de construction"
        domain={limits.reseauxDeChaleur.anneeConstruction}
        value={filters?.reseauxDeChaleur?.anneeConstruction}
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
          onClick={() => router.push(`/carte?rdc_filters=${filtersQueryParam}&tabId=reseaux/filtres`)}
          priority="tertiary"
          size="small"
          iconId="fr-icon-arrow-right-line"
          full
          iconPosition="right"
        >
          Voir la carte
        </Button>
      </FilterResetButtonWrapper>
    </>
  );
};

export default ReseauxDeChaleurFilters;
