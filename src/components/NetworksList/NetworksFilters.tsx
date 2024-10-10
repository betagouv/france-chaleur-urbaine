import Accordion from '@codegouvfr/react-dsfr/Accordion';
import Button from '@codegouvfr/react-dsfr/Button';
import Checkbox from '@codegouvfr/react-dsfr/Checkbox';
import { Range } from '@codegouvfr/react-dsfr/Range';
import Select from '@codegouvfr/react-dsfr/SelectNext';
import { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import {
  getLivraisonsAnnuellesFromPercentage,
  getPercentageFromLivraisonsAnnuelles,
  roundNumberProgressively,
} from '@components/Map/components/ReseauxDeChaleurFilters';
import Box from '@components/ui/Box';
import Divider from '@components/ui/Divider';
import Heading from '@components/ui/Heading';
import Icon from '@components/ui/Icon';
import Text from '@components/ui/Text';
import { Interval } from '@utils/interval';
import { ObjectKeys } from '@utils/typescript';
import { defaultInterval, FiltreEnergieConfKey, percentageMaxInterval } from 'src/services/Map/map-configuration';
import {
  emptyFilterNoLimits,
  energiesFilters,
  EnergiesFiltersConfKey,
  FilterLimits,
  FilterValues,
  intervalFilters,
} from 'src/types/NetworksFilters';

type MinOrMax = 'min' | 'max';

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
  padding: 16px 0px;
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

const gestionnairesFilters: string[] = ['Coriance', 'Dalkia', 'Engie Solutions', 'IDEX'];

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

  const [livraisonsChaleur, setLivraisonsChaleur] = useState<Interval>([
    filterLimits['livraisons_totale_MWh'][0],
    filterLimits['livraisons_totale_MWh'][1],
  ]);
  const refLivraisonsChaleur = useRef<HTMLDivElement>(null);
  const livraisonsChaleurToPercent = 100 / filterLimits['livraisons_totale_MWh'][1];

  //HACK - force re-render Range components when empty filters
  useEffect(() => {
    setEmpty(false);
  }, [empty]);

  function useComponentVisible(initialIsVisible: boolean) {
    const [isOpen, setIsOpen] = useState<boolean>(initialIsVisible);
    const ref = useRef<HTMLDivElement>(null);

    const handleClickOutside = (event: any) => {
      if (ref.current && !ref.current.contains(event.target)) {
        onFilterCount();
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

  //HACK - for non linear Range filter
  const onLivraisonsChaleurTextContent = useCallback(
    (minValue: string, maxValue: string) => {
      const textToUpdate = refLivraisonsChaleur?.current?.querySelector('.fr-range__output');
      if (textToUpdate) {
        textToUpdate.textContent = minValue + ' - ' + maxValue;
      }
    },
    [refLivraisonsChaleur]
  );

  useEffect(() => {
    if (isOpen) {
      //Convert livraisons annuelles de chaleur
      const valueMin: number =
        filterLimits.livraisons_totale_MWh[1] *
        (roundNumberProgressively(getPercentageFromLivraisonsAnnuelles(newFilterValues.livraisons_totale_MWh[0])) / 100);
      const valueMax: number =
        filterLimits.livraisons_totale_MWh[1] *
        (roundNumberProgressively(getPercentageFromLivraisonsAnnuelles(newFilterValues.livraisons_totale_MWh[1])) / 100);
      setLivraisonsChaleur([valueMin, valueMax]);
      onLivraisonsChaleurTextContent(
        newFilterValues.livraisons_totale_MWh[0].toString(),
        newFilterValues.livraisons_totale_MWh[1].toString()
      );

      //Count number of advanced filters to display them or not at the opening
      let nbAdvancedFilters = 0;
      energiesFilters.forEach((energieFilter: any) => {
        const confKey = energieFilter.confKey as EnergiesFiltersConfKey;
        if (filterLimits[confKey][0] !== newFilterValues[confKey][0] || filterLimits[confKey][1] !== newFilterValues[confKey][1]) {
          nbAdvancedFilters++;
        }
      });
      if (nbAdvancedFilters > 0) {
        setIsOpenEnergiesFilters(true);
      }
    }
  }, [isOpen]);

  function emptyFilters() {
    const emptyFilterValues: FilterValues = {
      ...filterLimits,
      ...emptyFilterNoLimits,
    };
    setNewFilterValues(emptyFilterValues);
    setLivraisonsChaleur(filterLimits['livraisons_totale_MWh']);
    setEmpty(true);
  }

  const onFilterCount = useCallback(() => {
    let nbFilters = 0;
    nbFilters += ObjectKeys(filterLimits).filter(
      (key) => filterLimits[key][0] !== newFilterValues[key][0] || filterLimits[key][1] !== newFilterValues[key][1]
    ).length;
    nbFilters += ObjectKeys(emptyFilterNoLimits).filter((key) => emptyFilterNoLimits[key] !== newFilterValues[key]).length;
    setFilterCount(nbFilters);
  }, [filterLimits, newFilterValues]);

  const applyFilters = useCallback(() => {
    onFilterCount();
    setIsOpen(false);
    onApplyFilters(newFilterValues);
  }, [filterLimits, emptyFilterNoLimits, newFilterValues]);

  const onChangeLivraisonsChaleur = useCallback(
    (rangeValue: number, minOrMax: MinOrMax) => {
      const textToUpdate = refLivraisonsChaleur?.current?.querySelector('.fr-range__output');
      const newValue: number = roundNumberProgressively(getLivraisonsAnnuellesFromPercentage(rangeValue * livraisonsChaleurToPercent));
      if (textToUpdate) {
        const text: string =
          minOrMax === 'min'
            ? newValue.toString() + ' - ' + newFilterValues['livraisons_totale_MWh'][1].toString()
            : newFilterValues['livraisons_totale_MWh'][0].toString() + ' - ' + newValue.toString();
        textToUpdate.textContent = text;
      }
      if (minOrMax === 'min') {
        setLivraisonsChaleur([rangeValue, livraisonsChaleur[1]]);
        setNewFilterValues({
          ...newFilterValues,
          livraisons_totale_MWh: [newValue, newFilterValues['livraisons_totale_MWh'][1]],
        });
      } else {
        setLivraisonsChaleur([livraisonsChaleur[0], rangeValue]);
        setNewFilterValues({
          ...newFilterValues,
          livraisons_totale_MWh: [newFilterValues['livraisons_totale_MWh'][0], newValue],
        });
      }
    },
    [refLivraisonsChaleur, livraisonsChaleurToPercent, livraisonsChaleur, newFilterValues]
  );

  return (
    <>
      <Button
        priority="secondary"
        size="medium"
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
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" m="2w">
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
                  <Divider />
                  <Box m="2w">
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
                              ref={filterConf.confKey === 'livraisons_totale_MWh' ? refLivraisonsChaleur : null}
                              key={filterConf.confKey}
                              double
                              label={filterConf.label}
                              min={filterLimits[filterConf.confKey] ? filterLimits[filterConf.confKey][0] : defaultInterval[0]}
                              max={filterLimits[filterConf.confKey] ? filterLimits[filterConf.confKey][1] : defaultInterval[1]}
                              suffix={filterConf.confKey === 'Taux EnR&R' ? '%' : ''}
                              nativeInputProps={[
                                {
                                  value:
                                    filterConf.confKey === 'livraisons_totale_MWh'
                                      ? livraisonsChaleur[0]
                                      : newFilterValues[filterConf.confKey][0],
                                  onChange: (e: any) => {
                                    if (filterConf.confKey === 'livraisons_totale_MWh') {
                                      onChangeLivraisonsChaleur(+e.target.value, 'min');
                                    } else {
                                      setNewFilterValues({
                                        ...newFilterValues,
                                        [filterConf.confKey]: [+e.target.value, newFilterValues[filterConf.confKey][1]],
                                      });
                                    }
                                  },
                                },
                                {
                                  value:
                                    filterConf.confKey === 'livraisons_totale_MWh'
                                      ? livraisonsChaleur[1]
                                      : newFilterValues[filterConf.confKey][1],
                                  onChange: (e: any) => {
                                    if (filterConf.confKey === 'livraisons_totale_MWh') {
                                      onChangeLivraisonsChaleur(+e.target.value, 'max');
                                    } else {
                                      setNewFilterValues({
                                        ...newFilterValues,
                                        [filterConf.confKey]: [newFilterValues[filterConf.confKey][0], +e.target.value],
                                      });
                                    }
                                  },
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
                            <Box my="2w" key={`box_${filterConf.confKey}`}>
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
                  </Box>
                  <Divider />
                  <Box display="flex" flexDirection="column" m="2w" gap="16px">
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
