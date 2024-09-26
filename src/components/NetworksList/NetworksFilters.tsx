import Accordion from '@codegouvfr/react-dsfr/Accordion';
import Button from '@codegouvfr/react-dsfr/Button';
import Checkbox from '@codegouvfr/react-dsfr/Checkbox';
import Input from '@codegouvfr/react-dsfr/Input';
import { Range } from '@codegouvfr/react-dsfr/Range';
import Select from '@codegouvfr/react-dsfr/SelectNext';
import { useState } from 'react';
import styled from 'styled-components';

import Box from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import Icon from '@components/ui/Icon';
import Text from '@components/ui/Text';
import { Interval } from '@utils/interval';
import { defaultInterval, EnergieRatioConfKey, FiltreEnergieConfKey, percentageMaxInterval } from 'src/services/Map/map-configuration';

const FiltersContainer = styled.div<{
  isOpen: boolean;
}>`
  border: none;
  color: inherit;
  visibility: ${({ isOpen }) => (!isOpen ? 'hidden' : 'inherit')};
  opacity: ${({ isOpen }) => (!isOpen ? '0' : '1')};
  background-color: rgba(22, 22, 22, 0.64);
  --ground: 2000;
  z-index: 1750;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transition:
    opacity 0.3s,
    visibility 0.3s;
`;

const FiltersBox = styled(Box)`
  width: 400px;
  padding: 16px;
  height: 100vh;
  overflow: auto;
  .fr-label {
    font-size: 0.9rem;
  }
  .network-filters-submit-button {
    width: 100%;
    justify-content: center;
  }
`;

const FiltersSeparator = styled.div`
  border: 1px solid #e1e1e1;
  margin: 16px 0px;
`;

export type FilterLimits = {
  tauxENRR: Interval;
  emissionsCO2: Interval;
  prixMoyen: Interval;
  livraisonsAnnuelles: Interval;
  anneeConstruction: Interval;
} & Record<EnergieRatioConfKey, Interval>;

export type FilterValues = {
  energieMajoritaire?: FiltreEnergieConfKey;
  gestionnaire: string;
  tauxENRR: Interval;
  emissionsCO2: Interval;
  prixMoyen: Interval;
  livraisonsAnnuelles: Interval;
  anneeConstruction: Interval;
  isClassed: boolean;
  test?: string;
} & Record<EnergieRatioConfKey, Interval>;

export const intervalFilters = [
  {
    label: 'Livraison de chaleur (GWh)',
    confKey: 'livraisonsAnnuelles',
  },
  {
    label: "Taux d'EnR&R",
    confKey: 'tauxENRR',
  },
  {
    label: 'Emission de CO2 (C02/kWh)',
    confKey: 'emissionsCO2',
  },
  {
    label: 'Prix moyen de la chaleur (€TTC/MWh)',
    confKey: 'prixMoyen',
  },
  {
    label: 'Année de construction',
    confKey: 'anneeConstruction',
  },
];

export const energiesFilters = [
  {
    label: 'Biomasse',
    confKey: 'energie_ratio_biomasse',
  },
  {
    label: 'Géothermie',
    confKey: 'energie_ratio_geothermie',
  },
  {
    label: 'UVE',
    confKey: 'energie_ratio_uve',
  },
  {
    label: 'Chaleur industrielle',
    confKey: 'energie_ratio_chaleurIndustrielle',
  },
  {
    label: 'Solaire thermique',
    confKey: 'energie_ratio_solaireThermique',
  },
  {
    label: 'Pompe à chaleur',
    confKey: 'energie_ratio_pompeAChaleur',
  },
  {
    label: 'Gaz',
    confKey: 'energie_ratio_gaz',
  },
  {
    label: 'Fioul',
    confKey: 'energie_ratio_fioul',
  },
];

function NetworksFilter({
  filterLimits,
  filterValues,
  onApplyFilters,
}: {
  filterLimits: FilterLimits;
  filterValues: FilterValues;
  onApplyFilters: (minConfig: FilterValues) => void;
}) {
  const [newFilterValues, setNewFilterValues] = useState<FilterValues>(filterValues);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isOpenEnergiesFilters, setIsOpenEnergiesFilters] = useState<boolean>(false);

  function applyFilters() {
    setIsOpen(false);
    onApplyFilters(newFilterValues);
  }

  return (
    <>
      <Button
        priority="secondary"
        size="medium"
        className="fr-mx-auto"
        onClick={() => {
          setIsOpen(true);
        }}
      >
        <Icon size="md" name="fr-icon-filter-line" color="var(--text-action-high-blue-france)" />
        Tous les filtres
      </Button>
      {isOpen && (
        <FiltersContainer isOpen={isOpen}>
          <FiltersBox backgroundColor="#fff">
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Box display="flex">
                <Icon size="md" name="fr-icon-filter-line" color="var(--text-action-high-blue-france)" />
                <Heading as="h5" color="grey" m="0">
                  Filtres
                </Heading>
              </Box>
              <button type="button" title="Fermer" onClick={() => setIsOpen(false)}>
                <Icon name="ri-close-line" size="md" color="var(--text-action-high-blue-france)" />
              </button>
            </Box>
            <FiltersSeparator />
            <Box m="2w">
              <Text size="sm">Type d'énergie majoritaire</Text>
              <Select
                label=""
                nativeSelectProps={{
                  value: newFilterValues.energieMajoritaire,
                  onChange: (e) => {
                    newFilterValues.energieMajoritaire = e.target.value === '' ? undefined : (e.target.value as FiltreEnergieConfKey);
                    setNewFilterValues({ ...newFilterValues });
                  },
                }}
                options={[
                  {
                    label: "Type d'énergie",
                    value: '',
                  },
                  ...energiesFilters.map(({ label, confKey }) => ({
                    label,
                    value: confKey,
                  })),
                ]}
              />
            </Box>
            <Box m="2w">
              <Input
                label="Gestionnaire"
                nativeInputProps={{
                  value: newFilterValues.gestionnaire,
                  onChange: (e) =>
                    setNewFilterValues({
                      ...newFilterValues,
                      gestionnaire: e.target.value,
                    }),
                }}
              />
            </Box>
            {intervalFilters.map(
              (filterConf) =>
                newFilterValues[filterConf.confKey as keyof FilterValues] && (
                  <Box m="2w" key={`box_${filterConf.confKey}`}>
                    <Range
                      key={filterConf.confKey}
                      double
                      label={filterConf.label}
                      min={
                        filterLimits[filterConf.confKey as keyof FilterLimits]
                          ? filterLimits[filterConf.confKey as keyof FilterLimits][0]
                          : defaultInterval[0]
                      }
                      max={
                        filterLimits[filterConf.confKey as keyof FilterLimits]
                          ? filterLimits[filterConf.confKey as keyof FilterLimits][1]
                          : defaultInterval[1]
                      }
                      nativeInputProps={[
                        {
                          value: (newFilterValues[filterConf.confKey as keyof FilterValues] as Interval)[0],
                          onChange: (e: any) =>
                            setNewFilterValues({
                              ...newFilterValues,
                              [filterConf.confKey as keyof FilterValues]: [
                                e.target.value,
                                (newFilterValues[filterConf.confKey as keyof FilterValues] as Interval)[1],
                              ],
                            }),
                        },
                        {
                          value: (newFilterValues[filterConf.confKey as keyof FilterValues] as Interval)[1],
                          onChange: (e: any) =>
                            setNewFilterValues({
                              ...newFilterValues,
                              [filterConf.confKey as keyof FilterValues]: [
                                (newFilterValues[filterConf.confKey as keyof FilterValues] as Interval)[0],
                                e.target.value,
                              ],
                            }),
                        },
                      ]}
                    />
                  </Box>
                )
            )}
            <Box m="2w">
              <Checkbox
                options={[
                  {
                    label: 'Réseaux classés',
                    nativeInputProps: {
                      name: 'classed-network',
                      checked: newFilterValues.isClassed,
                      onChange: (e: any) =>
                        setNewFilterValues({
                          ...newFilterValues,
                          isClassed: e.target.checked,
                        }),
                    },
                  },
                ]}
              />
            </Box>
            <Accordion
              label="Filtres avancés"
              onExpandedChange={(value) => setIsOpenEnergiesFilters(!value)}
              expanded={isOpenEnergiesFilters}
            >
              {energiesFilters.map(
                (filterConf) =>
                  newFilterValues[filterConf.confKey as keyof FilterValues] && (
                    <Box m="2w" key={`box_${filterConf.confKey}`}>
                      <Range
                        key={filterConf.confKey}
                        double
                        label={filterConf.label}
                        min={
                          filterLimits[filterConf.confKey as keyof FilterLimits]
                            ? filterLimits[filterConf.confKey as keyof FilterLimits][0]
                            : percentageMaxInterval[0]
                        }
                        max={
                          filterLimits[filterConf.confKey as keyof FilterLimits]
                            ? filterLimits[filterConf.confKey as keyof FilterLimits][1]
                            : percentageMaxInterval[1]
                        }
                        nativeInputProps={[
                          {
                            value: (newFilterValues[filterConf.confKey as keyof FilterValues] as Interval)[0],
                            onChange: (e: any) =>
                              setNewFilterValues({
                                ...newFilterValues,
                                [filterConf.confKey as keyof FilterValues]: [
                                  e.target.value,
                                  (newFilterValues[filterConf.confKey as keyof FilterValues] as Interval)[1],
                                ],
                              }),
                          },
                          {
                            value: (newFilterValues[filterConf.confKey as keyof FilterValues] as Interval)[1],
                            onChange: (e: any) =>
                              setNewFilterValues({
                                ...newFilterValues,
                                [filterConf.confKey as keyof FilterValues]: [
                                  (newFilterValues[filterConf.confKey as keyof FilterValues] as Interval)[0],
                                  e.target.value,
                                ],
                              }),
                          },
                        ]}
                      />
                    </Box>
                  )
              )}
            </Accordion>
            <FiltersSeparator />
            <Button className="network-filters-submit-button" onClick={() => applyFilters()}>
              Appliquer
            </Button>
          </FiltersBox>
        </FiltersContainer>
      )}
    </>
  );
}

export default NetworksFilter;
