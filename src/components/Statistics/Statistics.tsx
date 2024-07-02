import Graph from '@components/Graph';
import HoverableIcon from '@components/Hoverable/HoverableIcon';
import Slice from '@components/Slice';
import statistics from '@data/statistics';
import { fetchJSON } from '@utils/network';
import Link from 'next/link';
import { useMemo } from 'react';
import { MatomoMonthStat } from 'src/services/matomo_types';
import useSWR from 'swr';
import {
  Column,
  ColumnContainer,
  Container,
  GraphsWrapper,
  HorizontalSeparator,
  LastActuDate,
  LoadingTextHighlight,
  NumberBlock,
  NumberContainer,
  NumberHighlight,
  NumberHoverableIcon,
  NumberItalicText,
  NumberSubText,
  NumberText,
  StatisticsSliceContainer,
} from './Statistics.style';

type ReturnApiStatAirtable = {
  date: string;
  nbTotal: number;
  nbEligible: number;
  nbUneligible: number;
};

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

const getFormattedDataSum = (
  formatedData: number[][],
  startYear?: number,
  startMonth?: number
) => {
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
  getValueFonction: (
    year: string,
    monthIndex: number,
    entry: Data
  ) => number | undefined | null
): number[][] => {
  if (!data) {
    return [];
  }
  const returnData = Array.from({ length: 12 }, (n, i) => [
    monthToString[i],
    ...new Array(yearsList.length).fill(null),
  ]);
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

const Statistics = () => {
  const { data: dataActions, error: errorDataActions } = useSWR<
    MatomoMonthStat[]
  >('/api/statistiques/actions', fetchJSON, {
    onError: (err) => console.warn('errorDataActions >>', err),
  });

  const formatedDataEligibilityTest = getFormattedData(
    dataActions,
    (year: string, monthIndex: number, entry) => {
      const [entryYear, entryMonth] = entry?.date?.split('-') || ['YYYY', 'MM'];
      if (parseInt(entryMonth) - 1 === monthIndex && entryYear === year) {
        return (
          (entry['Formulaire de test - Adresse Inéligible'] ?? 0) +
          (entry['Formulaire de test - Adresse Éligible'] ?? 0) +
          (entry['Formulaire de test - Carte - Adresse Inéligible'] ?? 0) +
          (entry['Formulaire de test - Carte - Adresse Éligible'] ?? 0) +
          (entry['Formulaire de test - Fiche réseau - Adresse Inéligible'] ??
            0) +
          (entry['Formulaire de test - Fiche réseau - Adresse Éligible'] ?? 0)
        );
      }
    }
  );

  const { data: dataVisits, error: errorVisits } = useSWR<MatomoMonthStat[]>(
    '/api/statistiques/visits',
    fetchJSON,
    {
      onError: (err) => console.warn('errorVisits >>', err),
    }
  );

  const formatedDataVisits = getFormattedData(
    dataVisits,
    (year: string, monthIndex: number, entry) => {
      const [entryYear, entryMonth] = entry?.date?.split('-') || ['YYYY', 'MM'];
      if (parseInt(entryMonth) - 1 === monthIndex && entryYear === year) {
        return entry.value;
      }
    }
  );

  //From Airtable
  const { data: rawDataCountContact, error: errorCountContact } = useSWR<any>(
    '/api/statistiques/contacts?group=monthly',
    fetchJSON,
    {
      onError: (err) => console.warn('errorCountContact >>', err),
    }
  );
  const dataCountContact = useMemo(
    () =>
      rawDataCountContact
        ? Object.entries(
            (rawDataCountContact as Record<string, ReturnApiStatAirtable>) || {}
          ).map(([, { ...value }]) => {
            return {
              ...value,
            };
          })
        : undefined,
    [rawDataCountContact]
  );
  const formatedDataCountContact = getFormattedData(
    dataCountContact,
    (year: string, monthIndex: number, entry) => {
      const [entryYear, entryMonth] = entry?.date?.split('-') || ['YYYY', 'MM'];
      if (
        parseInt(entryMonth) - 1 === monthIndex &&
        entryYear === year &&
        (entryYear !== today.getFullYear().toString() ||
          parseInt(entryMonth) - 1 !== today.getMonth())
      ) {
        return entry.nbTotal;
      }
    }
  );

  const { data: rawDataCountBulkContact, error: errorCountBulkContact } =
    useSWR<any>('/api/statistiques/bulk', fetchJSON, {
      onError: (err) => console.warn('errorCountContact >>', err),
    });

  const dataCountBulkContact = useMemo(
    () =>
      rawDataCountBulkContact
        ? Object.entries(
            (rawDataCountBulkContact as Record<
              string,
              ReturnApiStatAirtable
            >) || {}
          ).map(([key, value]) => {
            return {
              period: key,
              ...value,
            };
          })
        : undefined,
    [rawDataCountBulkContact]
  );
  const formatedDataCountBulkContact = getFormattedData(
    dataCountBulkContact,
    (year: string, monthIndex: number, entry) => {
      const [entryYear, entryMonth] = entry?.period?.split('-') || [
        'YYYY',
        'MM',
      ];
      if (
        parseInt(entryMonth) - 1 === monthIndex &&
        entryYear === year &&
        (entryYear !== today.getFullYear().toString() ||
          parseInt(entryMonth) - 1 !== today.getMonth())
      ) {
        return entry.nbTotal;
      }
    }
  );

  const { data: dataVisitsMap, error: errorVisitsMap } = useSWR<
    MatomoMonthStat[]
  >('/api/statistiques/visitsMap', fetchJSON, {
    onError: (err) => console.warn('errorVisitsMap >>', err),
  });

  const formatedDataVisitsMap = getFormattedData(
    dataVisitsMap,
    (year: string, monthIndex: number, entry) => {
      const [entryYear, entryMonth] = entry?.date?.split('-') || ['YYYY', 'MM'];
      if (parseInt(entryMonth) - 1 === monthIndex && entryYear === year) {
        return entry.value;
      }
    }
  );

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
    const startYear = 2023;
    const startMonth = 5;
    const nbAdressesTests = getFormattedDataSum(
      formatedDataEligibilityTest,
      startYear,
      startMonth
    );
    const nbVisits = getFormattedDataSum(
      formatedDataVisits,
      startYear,
      startMonth
    );
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
            (entry['Formulaire de test - Adresse Inéligible'] ?? 0) +
            (entry['Formulaire de test - Adresse Éligible'] ?? 0) +
            (entry['Formulaire de test - Carte - Adresse Inéligible'] ?? 0) +
            (entry['Formulaire de test - Carte - Adresse Éligible'] ?? 0) +
            (entry['Formulaire de test - Fiche réseau - Adresse Inéligible'] ??
              0) +
            (entry['Formulaire de test - Fiche réseau - Adresse Éligible'] ??
              0);
          nbTotalEligible +=
            (entry['Formulaire de test - Adresse Éligible'] ?? 0) +
            (entry['Formulaire de test - Carte - Adresse Éligible'] ?? 0) +
            (entry['Formulaire de test - Fiche réseau - Adresse Éligible'] ??
              0);
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

  return (
    <Container>
      <Slice padding={2}>
        <h2> Statistiques</h2>
      </Slice>
      <Slice>
        <StatisticsSliceContainer>
          <Column className="fr-col-md-8 fr-col-12">
            <ColumnContainer>
              <LastActuDate>Au {statistics.lastActu} :</LastActuDate>
              <NumberContainer>
                <NumberBlock className="fr-col-md-6 fr-col-12">
                  <NumberHighlight>{statistics.connection}</NumberHighlight>
                  Raccordements à l'étude
                  <HoverableIcon
                    iconName="ri-information-fill"
                    position="bottom"
                    iconSize="md"
                  >
                    Par raccordements à l’étude, on désigne ceux pour lesquels
                    une étude de faisabilité technico-économique est en cours au
                    niveau du gestionnaire du réseau, ou a été transmise à la
                    copropriété ou au bâtiment tertiaire. En copropriété, la
                    proposition du gestionnaire de réseau devra ensuite être
                    votée en AG avant que les travaux ne puissent démarrer.
                  </HoverableIcon>
                  <br />
                  <NumberText>(~22 080 logements)</NumberText>
                  <br />
                  <NumberSubText className="fr-mt-1w">
                    A titre de comparaison, le nombre total de bâtiments
                    raccordés en France en 2022 s'élève à 2435
                  </NumberSubText>
                </NumberBlock>
                <NumberBlock className="fr-col-md-6 fr-col-12">
                  <NumberHighlight>~ {statistics.CO2Tons}</NumberHighlight>
                  Tonnes de CO2 potentiellement économisées par an
                  <br />
                  <NumberItalicText>
                    1 tonne = 1 aller-retour Paris-New York en avion
                  </NumberItalicText>
                </NumberBlock>
              </NumberContainer>
            </ColumnContainer>
          </Column>
          <Column className="fr-col-md-4 fr-col-12">
            <ColumnContainer>
              <LastActuDate>Au {statistics.lastActu} :</LastActuDate>
              <NumberContainer>
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
          </Column>
        </StatisticsSliceContainer>
      </Slice>
      <Slice>
        <StatisticsSliceContainer>
          <Column className="fr-col-md-8 fr-col-12">
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
          </Column>
          <Column className="fr-col-md-4 fr-col-12">
            <ColumnContainer>
              <NumberContainer>
                <NumberBlock>
                  <NumberHighlight>
                    {totalContactDemands > 0 ? (
                      totalContactDemands.toLocaleString('fr-FR')
                    ) : (
                      <>
                        <LoadingTextHighlight>
                          Chargement en cours...
                        </LoadingTextHighlight>
                        <br />
                      </>
                    )}
                  </NumberHighlight>
                  Total des demandes de mise en contact avec un gestionnaire
                </NumberBlock>
                <NumberBlock className="fr-mt-2w">
                  <NumberHighlight>
                    <span>{statistics.connectionPercent}%</span>
                    <NumberHoverableIcon>
                      <HoverableIcon
                        iconName="ri-information-fill"
                        position="bottom"
                        iconSize="md"
                      >
                        A savoir : une partie des demandes déposées (environ
                        50%) ne peut aboutir en raison d'une distance trop
                        importante au réseau ou d'un mode de chauffage
                        préexistant individuel.
                      </HoverableIcon>
                    </NumberHoverableIcon>
                  </NumberHighlight>
                  Des mises en contact aboutissent à un raccordement à l’étude
                </NumberBlock>
              </NumberContainer>
            </ColumnContainer>
          </Column>
        </StatisticsSliceContainer>
      </Slice>
      <Slice>
        <StatisticsSliceContainer>
          <Column className="fr-col-md-8 fr-col-12">
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
          </Column>
          <Column className="fr-col-md-4 fr-col-12">
            <ColumnContainer>
              <NumberContainer>
                <NumberBlock>
                  <NumberHighlight>
                    {totalAddressTests.toLocaleString('fr-FR')}
                  </NumberHighlight>
                  Total d'adresses testées
                </NumberBlock>
                <NumberBlock className="fr-mt-2w">
                  <NumberHighlight>
                    <span>{Math.round(percentAddressPossible)}%</span>
                    <NumberHoverableIcon>
                      <HoverableIcon
                        iconName="ri-information-fill"
                        position="bottom"
                        iconSize="md"
                      >
                        "Potentiellement raccordables" : tests effectués pour
                        des bâtiments situés à moins de 100 m d'un réseau (60 m
                        sur Paris)
                      </HoverableIcon>
                    </NumberHoverableIcon>
                  </NumberHighlight>
                  Des adresses testées sont potentiellement raccordables
                </NumberBlock>
              </NumberContainer>
            </ColumnContainer>
          </Column>
        </StatisticsSliceContainer>
      </Slice>
      <Slice>
        <StatisticsSliceContainer>
          <Column className="fr-col-md-8 fr-col-12">
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
          </Column>
          <Column className="fr-col-md-4 fr-col-12">
            <ColumnContainer>
              <NumberContainer>
                <NumberBlock>
                  <NumberHighlight>
                    {Math.round(percentAddressTests)}%
                  </NumberHighlight>
                  Des visiteurs testent une adresse
                </NumberBlock>
              </NumberContainer>
            </ColumnContainer>
          </Column>
        </StatisticsSliceContainer>
      </Slice>
      <Slice>
        <StatisticsSliceContainer>
          <Column className="fr-col-md-8 fr-col-12">
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
          </Column>
          <Column className="fr-col-md-4 fr-col-12">
            <ColumnContainer>
              <LastActuDate>Au {statistics.lastActu} :</LastActuDate>
              <NumberContainer>
                <NumberBlock>
                  <NumberHighlight>
                    {statistics.iFrameIntegration}
                  </NumberHighlight>
                  Intégrations de nos{' '}
                  <Link href="/collectivites-et-exploitants#iframe-carte">
                    iframes
                  </Link>
                </NumberBlock>
                <HorizontalSeparator />
                <NumberBlock>
                  <NumberHighlight>{totalDownload}</NumberHighlight>
                  Téléchargements des tracés sur le site
                </NumberBlock>
              </NumberContainer>
            </ColumnContainer>
          </Column>
        </StatisticsSliceContainer>
      </Slice>
      <Slice>
        <StatisticsSliceContainer>
          <Column className="fr-col-md-8 fr-col-12">
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
          </Column>
          <Column className="fr-col-md-4 fr-col-12">
            <ColumnContainer>
              <NumberContainer>
                <NumberBlock>
                  <NumberHighlight>
                    {totalBulkTests.toLocaleString('fr-FR')}
                  </NumberHighlight>
                  Total d'adresses testées en liste (tests en masse par des
                  professionnels)
                </NumberBlock>
              </NumberContainer>
            </ColumnContainer>
          </Column>
        </StatisticsSliceContainer>
      </Slice>
    </Container>
  );
};

export default Statistics;
