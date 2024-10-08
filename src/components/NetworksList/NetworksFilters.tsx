import Accordion from '@codegouvfr/react-dsfr/Accordion';
import Button from '@codegouvfr/react-dsfr/Button';
import Checkbox from '@codegouvfr/react-dsfr/Checkbox';
import { Range } from '@codegouvfr/react-dsfr/Range';
import Select from '@codegouvfr/react-dsfr/SelectNext';
import { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import Box from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import Icon from '@components/ui/Icon';
import Text from '@components/ui/Text';
import { defaultInterval, FiltreEnergieConfKey, percentageMaxInterval } from 'src/services/Map/map-configuration';
import {
  emptyFilterNoLimits,
  energiesFilters,
  FilterLimits,
  FilterNoLimits,
  FilterValues,
  intervalFilters,
} from 'src/types/NetworksFilters';

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

const gestionnairesFilters: string[] = ['Coriance', 'Dalkia', 'IDEX', 'Engie Solutions'];

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
  const [isOpenEnergiesFilters, setIsOpenEnergiesFilters] = useState<boolean>(false);

  const [empty, setEmpty] = useState<boolean>(false);

  useEffect(() => {
    setEmpty(false);
  }, [empty]);

  function useComponentVisible(initialIsVisible: boolean) {
    const [isOpen, setIsOpen] = useState<boolean>(initialIsVisible);
    const ref = useRef<HTMLDivElement>(null);

    const handleClickOutside = (event: any) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setNewFilterValues(filterValues);
        setIsOpen(false);
      }
    };

    useEffect(() => {
      document.addEventListener('click', handleClickOutside, true);
      return () => {
        document.removeEventListener('click', handleClickOutside, true);
      };
    }, [filterValues]);

    return { ref, isOpen, setIsOpen };
  }
  const { ref, isOpen, setIsOpen } = useComponentVisible(false);

  function emptyFilters() {
    const emptyFilterValues: FilterValues = {
      ...filterLimits,
      ...emptyFilterNoLimits,
    };
    setNewFilterValues(emptyFilterValues);
    setEmpty(true);
  }

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
      {isOpen && (
        <FiltersContainer isOpen={isOpen}>
          <div ref={ref}>
            <FiltersBox backgroundColor="#fff">
              {!empty && (
                <>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box display="flex">
                      <Icon size="md" name="fr-icon-filter-line" color="var(--text-action-high-blue-france)" />
                      <Heading as="h5" color="grey" m="0">
                        Filtres
                      </Heading>
                    </Box>
                    <button
                      type="button"
                      title="Fermer"
                      onClick={() => {
                        setNewFilterValues(filterValues);
                        setIsOpen(false);
                      }}
                    >
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
                    <Text size="sm">Énergie mobilisée</Text>
                    <Select
                      label=""
                      nativeSelectProps={{
                        value: newFilterValues.energieMobilisee,
                        onChange: (e) => {
                          newFilterValues.energieMobilisee = e.target.value !== '' ? (e.target.value as FiltreEnergieConfKey) : '';
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
                          label: '',
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
                    <Text size="sm">Gestionnaire</Text>
                    <Select
                      label=""
                      nativeSelectProps={{
                        value: newFilterValues.gestionnaire,
                        onChange: (e) => {
                          newFilterValues.gestionnaire = e.target.value;
                          setNewFilterValues({ ...newFilterValues });
                        },
                      }}
                      options={[
                        {
                          label: '',
                          value: '',
                        },
                        ...gestionnairesFilters.map((gestionnaire: string) => ({
                          label: gestionnaire,
                          value: gestionnaire,
                        })),
                      ]}
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
                            suffix={filterConf.confKey === 'Taux EnR&R' ? '%' : ''}
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
                              suffix="%"
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
                </>
              )}
            </FiltersBox>
          </div>
        </FiltersContainer>
      )}
    </>
  );
}

export default NetworksFilter;
