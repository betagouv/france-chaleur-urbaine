import Accordion from '@codegouvfr/react-dsfr/Accordion';
import Button from '@codegouvfr/react-dsfr/Button';
import Checkbox from '@codegouvfr/react-dsfr/Checkbox';
import Input from '@codegouvfr/react-dsfr/Input';
import { Range } from '@codegouvfr/react-dsfr/Range';
import Select from '@codegouvfr/react-dsfr/SelectNext';
import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import Box from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import Icon from '@components/ui/Icon';
import Text from '@components/ui/Text';
import { defaultInterval, FiltreEnergieConfKey, percentageMaxInterval } from 'src/services/Map/map-configuration';
import { emptyFilterNoLimits, FilterLimits, FilterNoLimits, FilterValues, IntervalAndEnergiesFilters } from 'src/types/NetworksFilters';

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

export const intervalFilters = [
  {
    label: 'Livraisons de chaleur annuelles (GWh)',
    confKey: 'livraisons_totale_MWh',
    rdcLimitKey: 'livraisonsAnnuelles',
  },
  {
    label: "Taux d'EnR&R",
    confKey: 'Taux EnR&R',
    rdcLimitKey: 'tauxENRR',
  },
  {
    label: 'Emission de CO2 (gC02/kWh)',
    confKey: 'contenu CO2 ACV',
    rdcLimitKey: 'emissionsCO2',
  },
  {
    label: 'Prix moyen de la chaleur (€TTC/MWh)',
    confKey: 'PM',
    rdcLimitKey: 'prixMoyen',
  },
  {
    label: 'Année de construction',
    confKey: 'annee_creation',
    rdcLimitKey: 'anneeConstruction',
  },
] as const satisfies ReadonlyArray<IntervalAndEnergiesFilters>;

export type IntervalFiltersConfKey = (typeof intervalFilters)[number]['confKey'];

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
] as const satisfies ReadonlyArray<IntervalAndEnergiesFilters>;

function NetworksFilter({
  filterLimits,
  filterValues,
  regionsList,
  onApplyFilters,
}: {
  filterLimits: FilterLimits;
  filterValues: FilterValues;
  regionsList: string[];
  onApplyFilters: (minConfig: FilterValues) => void;
}) {
  const [newFilterValues, setNewFilterValues] = useState<FilterValues>(filterValues);
  const [filterCount, setFilterCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isOpenEnergiesFilters, setIsOpenEnergiesFilters] = useState<boolean>(false);

  const [empty, setEmpty] = useState<boolean>(false);

  useEffect(() => {
    setEmpty(false);
  }, [empty]);

  const applyFilters = useCallback(() => {
    let nbFilters = 0;
    Object.keys(filterLimits).forEach((key) => {
      if (filterLimits[key as keyof FilterLimits][0] !== newFilterValues[key as keyof FilterLimits][0]) {
        nbFilters++;
      } else if (filterLimits[key as keyof FilterLimits][1] !== newFilterValues[key as keyof FilterLimits][1]) {
        nbFilters++;
      }
    });
    Object.keys(emptyFilterNoLimits).forEach((key) => {
      if (emptyFilterNoLimits[key as keyof FilterNoLimits] !== newFilterValues[key as keyof FilterNoLimits]) {
        nbFilters++;
      }
    });
    setFilterCount(nbFilters);
    setIsOpen(false);
    onApplyFilters(newFilterValues);
  }, [filterLimits, emptyFilterNoLimits, newFilterValues]);

  function emptyFilters() {
    const emptyFilterValues: FilterValues = {
      ...filterLimits,
      energieMajoritaire: '',
      gestionnaire: '',
      isClassed: false,
      region: '',
    };
    setNewFilterValues(emptyFilterValues);
    setEmpty(true);
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
        Tous les filtres ({filterCount})
      </Button>
      {isOpen && !empty && (
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
              <Checkbox
                small
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
            <Box m="2w">
              <Text size="sm">Type d'énergie majoritaire</Text>
              <Select
                label=""
                nativeSelectProps={{
                  value: newFilterValues.energieMajoritaire,
                  onChange: (e) => {
                    newFilterValues.energieMajoritaire = e.target.value !== '' ? (e.target.value as FiltreEnergieConfKey) : '';
                    setNewFilterValues({ ...newFilterValues });
                  },
                }}
                options={[
                  {
                    label: 'Sélectionner une option',
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
              <Text size="sm">Région</Text>
              <Select
                label=""
                nativeSelectProps={{
                  value: newFilterValues.region,
                  onChange: (e) => {
                    newFilterValues.region = e.target.value;
                    setNewFilterValues({ ...newFilterValues });
                  },
                }}
                options={[
                  {
                    label: 'Sélectionner une région',
                    value: '',
                  },
                  ...regionsList.map((region: string) => ({
                    label: region,
                    value: region,
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
                newFilterValues[filterConf.confKey] && (
                  <Box m="2w" key={`box_${filterConf.confKey}`}>
                    <Range
                      key={filterConf.confKey}
                      double
                      label={filterConf.label}
                      min={filterLimits[filterConf.confKey] ? filterLimits[filterConf.confKey][0] : defaultInterval[0]}
                      max={filterLimits[filterConf.confKey] ? filterLimits[filterConf.confKey][1] : defaultInterval[1]}
                      nativeInputProps={[
                        {
                          value: newFilterValues[filterConf.confKey][0],
                          onChange: (e: any) =>
                            setNewFilterValues({
                              ...newFilterValues,
                              [filterConf.confKey]: [+e.target.value, newFilterValues[filterConf.confKey][1]],
                            }),
                        },
                        {
                          value: newFilterValues[filterConf.confKey][1],
                          onChange: (e: any) =>
                            setNewFilterValues({
                              ...newFilterValues,
                              [filterConf.confKey]: [newFilterValues[filterConf.confKey][0], +e.target.value],
                            }),
                        },
                      ]}
                    />
                  </Box>
                )
            )}
            <Accordion
              label="Filtres avancés"
              onExpandedChange={(value) => setIsOpenEnergiesFilters(!value)}
              expanded={isOpenEnergiesFilters}
            >
              {energiesFilters.map(
                (filterConf) =>
                  newFilterValues[filterConf.confKey] && (
                    <Box m="2w" key={`box_${filterConf.confKey}`}>
                      <Range
                        key={filterConf.confKey}
                        double
                        label={filterConf.label}
                        min={filterLimits[filterConf.confKey] ? filterLimits[filterConf.confKey][0] : percentageMaxInterval[0]}
                        max={filterLimits[filterConf.confKey] ? filterLimits[filterConf.confKey][1] : percentageMaxInterval[1]}
                        nativeInputProps={[
                          {
                            value: newFilterValues[filterConf.confKey][0],
                            onChange: (e: any) =>
                              setNewFilterValues({
                                ...newFilterValues,
                                [filterConf.confKey]: [+e.target.value, newFilterValues[filterConf.confKey][1]],
                              }),
                          },
                          {
                            value: newFilterValues[filterConf.confKey][1],
                            onChange: (e: any) =>
                              setNewFilterValues({
                                ...newFilterValues,
                                [filterConf.confKey]: [newFilterValues[filterConf.confKey][0], +e.target.value],
                              }),
                          },
                        ]}
                      />
                    </Box>
                  )
              )}
            </Accordion>
            <FiltersSeparator />
            <Box>
              <Button className="network-filters-submit-button" priority="tertiary" onClick={() => emptyFilters()}>
                Effacer les filtres
              </Button>
              <Button className="network-filters-submit-button" onClick={() => applyFilters()}>
                Appliquer
              </Button>
            </Box>
          </FiltersBox>
        </FiltersContainer>
      )}
    </>
  );
}

export default NetworksFilter;
