import Link from 'next/link';
import { useMemo } from 'react';

import Graph from '@/components/Graph';
import Slice from '@/components/Slice';
import Hero, { HeroTitle } from '@/components/ui/Hero';
import Loader from '@/components/ui/Loader';
import Tooltip from '@/components/ui/Tooltip';
import statistics from '@/data/statistics';
import { useFetch } from '@/hooks/useApi';
import { type Statistiques } from '@/pages/api/statistiques/all';
import { type MatomoMonthStat } from '@/server/services/matomo_types';
import { STAT_LABEL } from '@/types/enum/MatomoStats';
import { dayjs } from '@/utils/date';

import {
  ColumnContainer,
  Container,
  GraphsWrapper,
  HorizontalSeparator,
  LastActuDate,
  NumberBlock,
  NumberContainer,
  NumberHighlight,
  NumberSubText,
  NumberText,
  StatisticsSliceContainer,
} from './Statistics.style';

const getYearsList = () => {
  const years = [];
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  const currentYearPreviousMonth = date.getFullYear();
  for (let year = 2022; year <= currentYearPreviousMonth; year++) {
    years.push(year.toString());
  }
  return years;
};
const yearsList = getYearsList();

const monthToString = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

const today = new Date();

const graphOptions = {
  large: true,
  legendPosition: 'top',
  legendAlignment: 'end',
  titleTextStyle: { fontSize: 16, bold: false },
  hAxisTextStyle: { color: '7C8DB5' },
  vAxisTextStyle: { color: '7C8DB5' },
  colors: ['#83B0F3', '#64B847', '#1f8d49', '#009099'],
};

const getFormattedDataSum = (formatedData: number[][], startYear?: number, startMonth?: number) => {
  //Month : 1 to 12
  let nbTotal = 0;
  formatedData &&
    formatedData.map((data, key: number) => {
      if (key !== 0) {
        for (let i = 1; i <= yearsList.length; i++) {
          if (startYear && startMonth) {
            if (parseInt(yearsList[i - 1]) >= startYear && key >= startMonth) {
              nbTotal += data[i];
            }
          } else {
            nbTotal += data[i];
          }
        }
      }
    });
  return nbTotal;
};

const getFormattedData = <Data,>(
  data: Data[] | undefined,
  getValueFonction: (year: string, monthIndex: number, entry: Data) => number | undefined | null
): number[][] => {
  if (!data) {
    return [];
  }
  const returnData = Array.from({ length: 12 }, (n, i) => [monthToString[i], ...new Array(yearsList.length).fill(null)]);
  let notEmpty = false;
  yearsList.forEach((year: string, i) => {
    monthToString.forEach((month: string, j) => {
      data.find((entry) => {
        const value = getValueFonction(year, j, entry);
        if (value) {
          notEmpty = true;
          returnData[j][i + 1] = value;
        }
      });
    });
  });
  if (notEmpty) {
    returnData.unshift(['x', ...yearsList]);
  }
  return returnData;
};

const NumberHighLightLoading = ({ loading, children }: { loading: boolean; children: React.ReactNode }) => {
  return <NumberHighlight>{loading ? <Loader size="md" /> : children}</NumberHighlight>;
};

const Statistics = () => {
  const {
    data: dataActions,
    error: errorDataActions,
    isLoading: isLoadingDataActions,
  } = useFetch<MatomoMonthStat[]>('/api/statistiques/actions');

  const totalComparateurTests = useMemo(() => {
    if (!dataActions) return 0;

    return dataActions.reduce((total, entry) => {
      return total + (entry[STAT_LABEL.FORM_TEST_COMPARATEUR_ELIGIBLE] ?? 0) + (entry[STAT_LABEL.FORM_TEST_COMPARATEUR_UNELIGIBLE] ?? 0);
    }, 0);
  }, [dataActions]);

  const formatedDataEligibilityTest = getFormattedData(dataActions, (year: string, monthIndex: number, entry) => {
    const [entryYear, entryMonth] = entry?.date?.split('-') || ['YYYY', 'MM'];
    if (parseInt(entryMonth) - 1 === monthIndex && entryYear === year) {
      return (
        (entry[STAT_LABEL.FORM_TEST_UNELIGIBLE] ?? 0) +
        (entry[STAT_LABEL.FORM_TEST_ELIGIBLE] ?? 0) +
        (entry[STAT_LABEL.FORM_TEST_CARTE_UNELIGIBLE] ?? 0) +
        (entry[STAT_LABEL.FORM_TEST_CARTE_ELIGIBLE] ?? 0) +
        (entry[STAT_LABEL.FORM_TEST_FICHE_RESEAU_UNELIGIBLE] ?? 0) +
        (entry[STAT_LABEL.FORM_TEST_FICHE_RESEAU_ELIGIBLE] ?? 0) +
        (entry[STAT_LABEL.FORM_TEST_COMPARATEUR_UNELIGIBLE] ?? 0) +
        (entry[STAT_LABEL.FORM_TEST_COMPARATEUR_ELIGIBLE] ?? 0)
      );
    }
  });

  const { data: stats, isLoading: statsLoading } = useFetch<Statistiques>('/api/statistiques/all');

  const { data: dataVisits, error: errorVisits } = useFetch<MatomoMonthStat[]>('/api/statistiques/visits');

  const formatedDataVisits = getFormattedData(dataVisits, (year: string, monthIndex: number, entry) => {
    const [entryYear, entryMonth] = entry?.date?.split('-') || ['YYYY', 'MM'];
    if (parseInt(entryMonth) - 1 === monthIndex && entryYear === year) {
      return entry.value;
    }
  });

  //From Airtable
  const {
    data: dataCountContact,
    error: errorCountContact,
    isLoading: isLoadingCountContact,
  } = useFetch<any>('/api/statistiques/contacts?group=monthly');

  const formatedDataCountContact = getFormattedData(dataCountContact, (year: string, monthIndex: number, entry: any) => {
    const [entryYear, entryMonth] = entry?.date?.split('-') || ['YYYY', 'MM'];
    if (
      parseInt(entryMonth) - 1 === monthIndex &&
      entryYear === year &&
      (entryYear !== today.getFullYear().toString() || parseInt(entryMonth) - 1 !== today.getMonth())
    ) {
      return entry.nbTotal;
    }
  });

  const {
    data: dataCountBulkContact,
    error: errorCountBulkContact,
    isLoading: isLoadingCountBulkContact,
  } = useFetch<any>('/api/statistiques/bulk');

  const formatedDataCountBulkContact = getFormattedData(dataCountBulkContact, (year: string, monthIndex: number, entry: any) => {
    const [entryYear, entryMonth] = entry?.date?.split('-') || ['YYYY', 'MM'];
    if (
      parseInt(entryMonth) - 1 === monthIndex &&
      entryYear === year &&
      (entryYear !== today.getFullYear().toString() || parseInt(entryMonth) - 1 !== today.getMonth())
    ) {
      return entry.nbTotal;
    }
  });

  const { data: dataVisitsMap, error: errorVisitsMap } = useFetch<MatomoMonthStat[]>('/api/statistiques/visitsMap');

  const formatedDataVisitsMap = getFormattedData(dataVisitsMap, (year: string, monthIndex: number, entry) => {
    const [entryYear, entryMonth] = entry?.date?.split('-') || ['YYYY', 'MM'];
    if (parseInt(entryMonth) - 1 === monthIndex && entryYear === year) {
      return entry.value;
    }
  });

  const totalContactDemands = useMemo(() => {
    //Not using formatted data because we want all data and not only since 2022
    let nbTotal = 0;
    if (dataCountContact) {
      dataCountContact.forEach((row: any) => {
        nbTotal += row.nbTotal;
      });
    }
    return nbTotal;
  }, [dataCountContact]);

  const totalAddressTests = useMemo(() => {
    return getFormattedDataSum(formatedDataEligibilityTest);
  }, [formatedDataEligibilityTest]);

  const totalBulkTests = useMemo(() => {
    return getFormattedDataSum(formatedDataCountBulkContact);
  }, [formatedDataCountBulkContact]);

  const percentAddressTests = useMemo(() => {
    const oneYearAgo = new Date(new Date().setFullYear(today.getFullYear() - 1));
    const startYear = oneYearAgo.getFullYear();
    const startMonth = oneYearAgo.getMonth() + 1;
    const nbAdressesTests = getFormattedDataSum(formatedDataEligibilityTest, startYear, startMonth);
    const nbVisits = getFormattedDataSum(formatedDataVisits, startYear, startMonth);
    if (nbVisits && nbAdressesTests) {
      return (nbAdressesTests / nbVisits) * 100;
    }
    return 0;
  }, [formatedDataEligibilityTest, formatedDataVisits]);

  const percentAddressPossible = useMemo(() => {
    let nbTotal = 0;
    let nbTotalEligible = 0;
    dataActions &&
      dataActions.forEach((entry) => {
        if (entry) {
          nbTotal +=
            (entry[STAT_LABEL.FORM_TEST_UNELIGIBLE] ?? 0) +
            (entry[STAT_LABEL.FORM_TEST_ELIGIBLE] ?? 0) +
            (entry[STAT_LABEL.FORM_TEST_CARTE_UNELIGIBLE] ?? 0) +
            (entry[STAT_LABEL.FORM_TEST_CARTE_ELIGIBLE] ?? 0) +
            (entry[STAT_LABEL.FORM_TEST_FICHE_RESEAU_UNELIGIBLE] ?? 0) +
            (entry[STAT_LABEL.FORM_TEST_FICHE_RESEAU_ELIGIBLE] ?? 0) +
            (entry[STAT_LABEL.FORM_TEST_COMPARATEUR_UNELIGIBLE] ?? 0) +
            (entry[STAT_LABEL.FORM_TEST_COMPARATEUR_ELIGIBLE] ?? 0);
          nbTotalEligible +=
            (entry[STAT_LABEL.FORM_TEST_ELIGIBLE] ?? 0) +
            (entry[STAT_LABEL.FORM_TEST_CARTE_ELIGIBLE] ?? 0) +
            (entry[STAT_LABEL.FORM_TEST_FICHE_RESEAU_ELIGIBLE] ?? 0) +
            (entry[STAT_LABEL.FORM_TEST_COMPARATEUR_ELIGIBLE] ?? 0);
        }
      });
    if (nbTotalEligible && nbTotal) {
      return (nbTotalEligible / nbTotal) * 100;
    }
    return 0;
  }, [dataActions]);

  const totalDownload = useMemo(() => {
    let nbTotal = 0;
    dataActions &&
      dataActions.forEach((entry) => {
        if (entry) {
          nbTotal += entry['Tracés'] ? entry['Tracés'] : 0;
        }
      });
    return nbTotal;
  }, [dataActions]);

  const lastCronUpdate = dayjs().subtract(1, 'month').endOf('month').format('LL');

  return (
    <>
      <Hero variant="ressource">
        <HeroTitle>Nos statistiques</HeroTitle>
      </Hero>
      <Container className="mt-8">
        <Slice>
          <StatisticsSliceContainer className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-md-8 fr-col-12">
              <ColumnContainer>
                <LastActuDate>Au {statistics.lastActu} :</LastActuDate>
                <NumberContainer $orientation="row">
                  <NumberBlock>
                    <NumberHighlight>{statistics.connection}</NumberHighlight>
                    Raccordements <strong>à l'étude, en cours ou effectif</strong>
                    <Tooltip title="Par raccordements à l’étude, on désigne ceux pour lesquels une étude de faisabilité technico-économique est en cours au niveau du gestionnaire du réseau, ou a été transmise à la copropriété ou au bâtiment tertiaire. En copropriété, la proposition du gestionnaire de réseau devra ensuite être votée en AG avant que les travaux ne puissent démarrer." />
                    <br />
                    <NumberText>(~{statistics.logements} logements)</NumberText>
                    <br />
                    <NumberSubText className="fr-mt-1w">
                      A titre de comparaison, le nombre total de bâtiments raccordés en France en 2023 s'élève à 2 685
                    </NumberSubText>
                  </NumberBlock>
                  <NumberBlock>
                    <NumberHighlight>~ {statistics.CO2Tons}</NumberHighlight>
                    Tonnes de CO2 potentiellement économisées par an
                    <br />
                    <NumberSubText className="fr-mt-1w">1 tonne = 1 aller-retour Paris-New York en avion</NumberSubText>
                  </NumberBlock>
                </NumberContainer>
              </ColumnContainer>
            </div>
            <div className="fr-col-md-4 fr-col-12">
              <ColumnContainer>
                <LastActuDate>Au {statistics.lastActu} :</LastActuDate>
                <NumberContainer className="flex-col">
                  <NumberBlock>
                    <NumberHighlight>{statistics.networks}</NumberHighlight>
                    Réseaux recensés représentant
                  </NumberBlock>
                  <NumberBlock className="fr-mt-2w">
                    <NumberHighlight>{statistics.heatPercent}%</NumberHighlight>
                    de la chaleur livrée par les réseaux en France
                  </NumberBlock>
                </NumberContainer>
              </ColumnContainer>
            </div>
          </StatisticsSliceContainer>
        </Slice>
        <Slice>
          <StatisticsSliceContainer className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-md-8 fr-col-12">
              <ColumnContainer padding="1rem">
                <GraphsWrapper>
                  <Graph
                    title="Nombre de demandes de mise en contact avec un gestionnaire"
                    error={errorCountContact}
                    data={dataCountContact}
                    formatedData={formatedDataCountContact}
                    {...graphOptions}
                  />
                </GraphsWrapper>
              </ColumnContainer>
            </div>
            <div className="fr-col-md-4 fr-col-12">
              <ColumnContainer>
                <LastActuDate>Au {lastCronUpdate} :</LastActuDate>
                <NumberContainer className="flex-col">
                  <NumberBlock>
                    <NumberHighLightLoading loading={isLoadingCountContact}>
                      {totalContactDemands.toLocaleString('fr-FR')}
                    </NumberHighLightLoading>
                    Total des demandes de mise en contact avec un gestionnaire
                  </NumberBlock>
                  <NumberBlock className="fr-mt-2w">
                    <NumberHighlight>
                      <span>{statistics.connectionPercent}%</span>
                      <Tooltip title="A savoir : une partie des demandes déposées (environ 50%) ne peut aboutir en raison d'une distance trop importante au réseau ou d'un mode de chauffage préexistant individuel." />
                    </NumberHighlight>
                    Des mises en contact aboutissent à un raccordement à l’étude
                  </NumberBlock>
                </NumberContainer>
              </ColumnContainer>
            </div>
          </StatisticsSliceContainer>
        </Slice>
        <Slice>
          <StatisticsSliceContainer className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-md-8 fr-col-12">
              <ColumnContainer padding="1rem">
                <GraphsWrapper>
                  <Graph
                    title="Nombre d’adresses testées"
                    error={errorDataActions}
                    data={dataActions}
                    formatedData={formatedDataEligibilityTest}
                    {...graphOptions}
                  />
                </GraphsWrapper>
              </ColumnContainer>
            </div>
            <div className="fr-col-md-4 fr-col-12">
              <ColumnContainer>
                <LastActuDate>Au {lastCronUpdate} :</LastActuDate>
                <NumberContainer>
                  <NumberBlock>
                    <NumberHighLightLoading loading={isLoadingDataActions}>
                      {totalAddressTests.toLocaleString('fr-FR')}
                    </NumberHighLightLoading>
                    Total d'adresses testées
                  </NumberBlock>
                  <NumberBlock className="fr-mt-2w">
                    <NumberHighLightLoading loading={isLoadingDataActions}>
                      <span>{Math.round(percentAddressPossible)}%</span>
                      <Tooltip
                        title={`"Potentiellement raccordables" : tests effectués pour des bâtiments situés à moins de 100 m d'un réseau (60 m sur Paris)`}
                      />
                    </NumberHighLightLoading>
                    Des adresses testées sont potentiellement raccordables
                  </NumberBlock>
                </NumberContainer>
              </ColumnContainer>
            </div>
          </StatisticsSliceContainer>
        </Slice>
        <Slice>
          <StatisticsSliceContainer className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-md-8 fr-col-12">
              <ColumnContainer padding="1rem">
                <GraphsWrapper>
                  <Graph
                    title="Nombre de visiteurs"
                    error={errorVisits}
                    data={dataVisits}
                    formatedData={formatedDataVisits}
                    {...graphOptions}
                  />
                </GraphsWrapper>
              </ColumnContainer>
            </div>
            <div className="fr-col-md-4 fr-col-12">
              <ColumnContainer>
                <LastActuDate>Au {lastCronUpdate} :</LastActuDate>
                <NumberContainer>
                  <NumberBlock>
                    <NumberHighLightLoading loading={isLoadingDataActions}>{Math.round(percentAddressTests)}%</NumberHighLightLoading>
                    Des visiteurs testent une adresse
                  </NumberBlock>
                  <HorizontalSeparator />
                  <NumberBlock>
                    <NumberHighLightLoading loading={isLoadingDataActions}>
                      {totalComparateurTests.toLocaleString('fr-FR')}
                    </NumberHighLightLoading>
                    simulations réalisées avec le comparateur de coûts et d'émissions de CO2 des modes de chauffage
                  </NumberBlock>
                </NumberContainer>
              </ColumnContainer>
            </div>
          </StatisticsSliceContainer>
        </Slice>
        <Slice>
          <StatisticsSliceContainer className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-md-8 fr-col-12">
              <ColumnContainer padding="1rem">
                <GraphsWrapper>
                  <Graph
                    title="Nombre de visiteurs sur la cartographie"
                    error={errorVisitsMap}
                    data={dataVisitsMap}
                    formatedData={formatedDataVisitsMap}
                    {...graphOptions}
                  />
                </GraphsWrapper>
              </ColumnContainer>
            </div>
            <div className="fr-col-md-4 fr-col-12">
              <ColumnContainer>
                <LastActuDate>Au {statistics.lastActu} :</LastActuDate>
                <NumberContainer>
                  <NumberBlock>
                    <NumberHighlight>{statistics.iFrameIntegration}</NumberHighlight>
                    Intégrations de nos <Link href="/collectivites-et-exploitants#iframe-carte">iframes</Link>
                  </NumberBlock>
                  <HorizontalSeparator />
                  <NumberBlock>
                    <NumberHighLightLoading loading={isLoadingDataActions}>
                      {totalDownload.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                    </NumberHighLightLoading>
                    Téléchargements des tracés sur le site
                  </NumberBlock>
                </NumberContainer>
              </ColumnContainer>
            </div>
          </StatisticsSliceContainer>
        </Slice>
        <Slice>
          <StatisticsSliceContainer className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-md-8 fr-col-12">
              <ColumnContainer padding="1rem">
                <GraphsWrapper>
                  <Graph
                    title="Nombre d’adresses testées par liste"
                    error={errorCountBulkContact}
                    data={dataCountBulkContact}
                    formatedData={formatedDataCountBulkContact}
                    {...graphOptions}
                  />
                </GraphsWrapper>
              </ColumnContainer>
            </div>
            <div className="fr-col-md-4 fr-col-12">
              <ColumnContainer>
                <LastActuDate>Au {lastCronUpdate} :</LastActuDate>
                <NumberContainer>
                  <NumberBlock>
                    <NumberHighLightLoading loading={isLoadingCountBulkContact}>
                      {totalBulkTests.toLocaleString('fr-FR')}
                    </NumberHighLightLoading>
                    Total d'adresses testées en liste (tests en masse par des professionnels)
                  </NumberBlock>
                  <HorizontalSeparator />
                  <NumberBlock>
                    <NumberHighLightLoading loading={statsLoading}>
                      {((stats?.comptes?.particuliers?.total || 0) + (stats?.comptes?.professionnels?.total || 0)).toLocaleString('fr-FR')}
                    </NumberHighLightLoading>
                    Comptes pro créés (bureaux d'études, bailleurs sociaux, ...)
                  </NumberBlock>
                </NumberContainer>
              </ColumnContainer>
            </div>
          </StatisticsSliceContainer>
        </Slice>
        <Slice>
          <StatisticsSliceContainer className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-md-8 fr-col-12">
              <ColumnContainer>
                <LastActuDate>Au {lastCronUpdate} :</LastActuDate>
                <NumberContainer $orientation="row">
                  <NumberBlock>
                    <NumberHighLightLoading loading={statsLoading}>
                      {(stats?.communesSansReseau?.testees?.total || 0).toLocaleString('fr-FR')}
                    </NumberHighLightLoading>
                    Communes sans réseau de chaleur ayant testé leur potentiel
                  </NumberBlock>
                  <NumberBlock>
                    <NumberHighLightLoading loading={statsLoading}>
                      {(stats?.communesSansReseau?.accompagnees?.total || 0).toLocaleString('fr-FR')}
                    </NumberHighLightLoading>
                    Communes accompagnées dans la démarche de création d'un réseau
                    <NumberSubText className="fr-mt-1w">mise en relation avec le Cerema, Amorce, les relais locaux</NumberSubText>
                  </NumberBlock>
                </NumberContainer>
              </ColumnContainer>
            </div>
          </StatisticsSliceContainer>
        </Slice>
      </Container>
    </>
  );
};

export default Statistics;
