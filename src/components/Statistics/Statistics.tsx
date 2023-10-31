import Graph from '@components/Graph';
import Slice from '@components/Slice';
import { useMemo } from 'react';
import useSWR from 'swr';
import {
  Column,
  ColumnContainer,
  Container,
  GraphsWrapper,
  LastActuDate,
  NumberBlock,
  NumberContainer,
  NumberHighlight,
  NumberHoverableIcon,
  NumberItalicText,
  StatisticsSliceContainer,
} from './Statistics.style';
import statistics from '@data/statistics';
import HoverableIcon from '@components/Hoverable/HoverableIcon';

type ReturnApiStatAirtable = {
  date: string;
  nbTotal: number;
  nbEligible: number;
  nbUneligible: number;
};

const yearList = ['2022', '2023'];
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

const graphOptions = {
  large: true,
  legendPosition: 'top',
  legendAlignment: 'end',
  titleTextStyle: { fontSize: 16, bold: false },
  hAxisTextStyle: { color: '7C8DB5' },
  vAxisTextStyle: { color: '7C8DB5' },
  colors: ['#83B0F3', '#64B847', '#1f8d49', '#009099'],
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const getEntryValue = (entry: any, value: string, data: string) => {
  if (entry && entry[value]) {
    return entry[value][data];
  }
  return 0;
};

const getFormattedDataSum = (formatedData: any[][]) => {
  let nbTotal = 0;
  formatedData &&
    formatedData.map((data, key) => {
      if (key != 0) {
        for (let i = 1; i <= yearList.length; i++) {
          nbTotal += data[i];
        }
      }
    });
  return nbTotal;
};

const getFormattedData = (
  data: any,
  getValueFonction: (year: string, monthIndex: number, entry: any) => any
) => {
  if (!data) {
    return [];
  }
  const returnData = Array.from({ length: 12 }, (n, i) =>
    new Array(yearList.length + 1).fill(monthToString[i], 0, 1).fill(null, 1, 3)
  );
  let notEmpty = false;
  yearList.forEach((year: string, i) => {
    monthToString.forEach((month: string, j) => {
      data.find((entry: any) => {
        const value = getValueFonction(year, j, entry);
        if (value) {
          notEmpty = true;
          returnData[j][i + 1] = value;
        }
      });
    });
  });
  if (notEmpty) {
    returnData.unshift(['x', ...yearList]);
  }
  return returnData;
};

const Statistics = () => {
  const { data: rawDataEligibilityTest, error: errorDataEligibilityTest } =
    useSWR('/api/statistiques/actions', fetcher, {
      onError: (err) => console.warn('errorDataEligibilityTest >>', err),
    });

  const dataEligibilityTest = useMemo(() => {
    if (rawDataEligibilityTest?.result.values.result === 'error') {
      return [];
    }
    return (
      rawDataEligibilityTest?.result.values
        .map((arr: any[], i: number) =>
          arr.reduce(
            (acc, entry) => {
              return {
                ...acc,
                [entry.label]: entry,
              };
            },
            { filters: rawDataEligibilityTest?.result.filters[i] }
          )
        )
        .reverse() ?? []
    );
  }, [rawDataEligibilityTest?.result]);

  const getFormatedDataEligibilityTest = () => {
    return getFormattedData(
      dataEligibilityTest,
      (year: string, monthIndex: number, entry: any) => {
        const [entryYear, entryMonth] = entry?.filters?.date?.split('-') || [
          'YYYY',
          'MM',
        ];
        if (parseInt(entryMonth) - 1 === monthIndex && entryYear === year) {
          const key =
            year === '2022' && (monthIndex === 4 || monthIndex === 5)
              ? 'nb_visits'
              : 'nb_events'; //Mai et juin
          return (
            getEntryValue(
              entry,
              'Formulaire de test - Adresse Inéligible',
              key
            ) +
            getEntryValue(
              entry,
              'Formulaire de test - Carte - Adresse Inéligible',
              key
            ) +
            getEntryValue(entry, 'Formulaire de test - Adresse Éligible', key) +
            getEntryValue(
              entry,
              'Formulaire de test - Carte - Adresse Éligible',
              key
            )
          );
        }
      }
    );
  };
  const formatedDataEligibilityTest = getFormatedDataEligibilityTest();

  const { data: rawDataVisits, error: errorVisits } = useSWR(
    '/api/statistiques/visits',
    fetcher,
    {
      onError: (err) => console.warn('errorVisits >>', err),
    }
  );

  const dataVisits = useMemo(() => {
    if (rawDataVisits?.result.values.result === 'error') {
      return [];
    }

    return (
      rawDataVisits?.result.values
        .map((data: any, i: number) => ({
          filters: rawDataVisits.result.filters[i],
          ...data,
        }))
        .reverse() ?? []
    );
  }, [rawDataVisits?.result]);

  const getFormatedDataVisits = () => {
    return getFormattedData(
      dataVisits,
      (year: string, monthIndex: number, entry: any) => {
        const [entryYear, entryMonth] = entry?.filters?.date?.split('-') || [
          'YYYY',
          'MM',
        ];
        if (parseInt(entryMonth) - 1 === monthIndex && entryYear === year) {
          return entry.nb_uniq_visitors;
        }
      }
    );
  };
  const formatedDataVisits = getFormatedDataVisits();

  const { data: rawDataCountContact, error: errorCountContact } = useSWR(
    '/api/statistiques/contacts?group=monthly',
    fetcher,
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
  const getFormatedDataCountContact = () => {
    return getFormattedData(
      dataCountContact,
      (year: string, monthIndex: number, entry: any) => {
        const [entryYear, entryMonth] = entry?.date?.split('-') || [
          'YYYY',
          'MM',
        ];
        if (parseInt(entryMonth) - 1 === monthIndex && entryYear === year) {
          return entry.nbTotal;
        }
      }
    );
  };
  const formatedDataCountContact = getFormatedDataCountContact();

  const { data: rawDataCountBulkContact, error: errorCountBulkContact } =
    useSWR('/api/statistiques/bulk', fetcher, {
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
  const getFormatedDataCountBulkContact = () => {
    return getFormattedData(
      dataCountBulkContact,
      (year: string, monthIndex: number, entry: any) => {
        const [entryYear, entryMonth] = entry?.period?.split('-') || [
          'YYYY',
          'MM',
        ];
        if (parseInt(entryMonth) - 1 === monthIndex && entryYear === year) {
          return entry.nbTotal;
        }
      }
    );
  };
  const formatedDataCountBulkContact = getFormatedDataCountBulkContact();

  const { data: rawDataVisitsMap, error: errorVisitsMap } = useSWR(
    '/api/statistiques/visitsMap',
    fetcher,
    {
      onError: (err) => console.warn('errorVisitsMap >>', err),
    }
  );

  const dataVisitsMap = useMemo(() => {
    if (rawDataVisitsMap?.result.values.result === 'error') {
      return [];
    }

    return (
      rawDataVisitsMap?.result.values
        .map((data: any, i: number) => ({
          date: rawDataVisitsMap.result.filters[i].date,
          ...data[0],
        }))
        .reverse() ?? []
    );
  }, [rawDataVisitsMap?.result]);

  const getFormatedDataVisitsMap = () => {
    return getFormattedData(
      dataVisitsMap,
      (year: string, monthIndex: number, entry: any) => {
        const [entryYear, entryMonth] = entry?.date?.split('-') || [
          'YYYY',
          'MM',
        ];
        if (parseInt(entryMonth) - 1 === monthIndex && entryYear === year) {
          return entry.nb_visits;
        }
      }
    );
  };
  const formatedDataVisitsMap = getFormatedDataVisitsMap();

  const totalContactDemands = useMemo(() => {
    return getFormattedDataSum(formatedDataCountContact);
  }, [formatedDataCountContact]);

  const totalAddressTests = useMemo(() => {
    return getFormattedDataSum(formatedDataEligibilityTest);
  }, [formatedDataEligibilityTest]);

  const totalBulkTests = useMemo(() => {
    return getFormattedDataSum(formatedDataCountBulkContact);
  }, [formatedDataCountBulkContact]);

  const percentAddressTests = useMemo(() => {
    const nbVisits = getFormattedDataSum(formatedDataVisits);
    if (nbVisits && totalAddressTests) {
      return (totalAddressTests / nbVisits) * 100;
    }
    return 0;
  }, [formatedDataVisits, totalAddressTests]);

  const percentAddressPossible = useMemo(() => {
    let nbTotal = 0;
    let nbTotalEligible = 0;
    dataEligibilityTest &&
      dataEligibilityTest.map((entry: any) => {
        const [entryYear, entryMonth] = entry?.filters?.date?.split('-') || [
          'YYYY',
          'MM',
        ];
        const key =
          entryYear === '2022' && (entryMonth - 1 === 5 || entryMonth - 1 === 6) //Mai et juin
            ? 'nb_visits'
            : 'nb_events';
        nbTotal +=
          getEntryValue(entry, 'Formulaire de test - Adresse Inéligible', key) +
          getEntryValue(
            entry,
            'Formulaire de test - Carte - Adresse Inéligible',
            key
          ) +
          getEntryValue(entry, 'Formulaire de test - Adresse Éligible', key) +
          getEntryValue(
            entry,
            'Formulaire de test - Carte - Adresse Éligible',
            key
          );
        nbTotalEligible +=
          getEntryValue(entry, 'Formulaire de test - Adresse Éligible', key) +
          getEntryValue(
            entry,
            'Formulaire de test - Carte - Adresse Éligible',
            key
          );
      });
    if (nbTotalEligible && nbTotal) {
      return (nbTotalEligible / nbTotal) * 100;
    }
    return 0;
  }, [dataEligibilityTest]);

  const totalDownload = useMemo(() => {
    let nbTotal = 0;
    dataEligibilityTest &&
      dataEligibilityTest.map((entry: any) => {
        nbTotal += getEntryValue(entry, 'Tracés', 'nb_events');
      });
    return nbTotal;
  }, [dataEligibilityTest]);

  return (
    <Container>
      <Slice padding={2}>
        <h2> Statistiques</h2>
      </Slice>
      <Slice>
        <StatisticsSliceContainer>
          <Column className="fr-col-md-8 fr-col-12">
            <ColumnContainer>
              <LastActuDate>Au {statistics.lastActu}</LastActuDate>
              <NumberContainer>
                <NumberBlock className="fr-col-md-5">
                  <NumberHighlight>{statistics.connection}</NumberHighlight>
                  Raccordements à l'étude
                  <HoverableIcon
                    iconName="ri-information-fill"
                    position="bottom"
                    iconSize="1x"
                  >
                    Par raccordements à l’étude, on désigne ceux pour lesquels
                    une étude de faisabilité technico-économique est en cours au
                    niveau du gestionnaire du réseau, ou a été transmise à la
                    copropriété ou au bâtiment tertiaire. En copropriété, la
                    proposition du gestionnaire de réseau devra ensuite être
                    votée en AG avant que les travaux ne puissent démarrer.
                  </HoverableIcon>
                </NumberBlock>
                <NumberBlock className="fr-col-md-7">
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
                {formatedDataCountContact.length > 1 && (
                  <Graph
                    title="Nombre de demandes de mise en contact avec un gestionnaire"
                    errors={errorCountContact}
                    data={dataCountContact}
                    formatedData={formatedDataCountContact}
                    {...graphOptions}
                  />
                )}
              </GraphsWrapper>
            </ColumnContainer>
          </Column>
          <Column className="fr-col-md-4 fr-col-12">
            <ColumnContainer>
              <NumberContainer>
                <NumberBlock>
                  <NumberHighlight>
                    {totalContactDemands.toLocaleString('fr-FR')}
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
                        iconSize="1x"
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
                {formatedDataEligibilityTest.length > 1 && (
                  <Graph
                    title="Nombre d’adresses testées (par mois)"
                    errors={errorDataEligibilityTest}
                    data={dataEligibilityTest}
                    formatedData={formatedDataEligibilityTest}
                    {...graphOptions}
                  />
                )}
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
                  Total nombre d’adresses testées
                </NumberBlock>
                <NumberBlock className="fr-mt-2w">
                  <NumberHighlight>
                    <span>{Math.round(percentAddressPossible)}%</span>
                    <NumberHoverableIcon>
                      <HoverableIcon
                        iconName="ri-information-fill"
                        position="bottom"
                        iconSize="1x"
                      >
                        "Potentiellement raccordables" : tests effectués pour
                        des bâtiments situés à moins de 100 m d'un réseau avec
                        un chauffage préexistant collectif.
                      </HoverableIcon>
                    </NumberHoverableIcon>
                  </NumberHighlight>
                  D’adresses potentiellement raccordables
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
                {formatedDataCountBulkContact.length > 1 && (
                  <Graph
                    title="Nombre d’adresses testées par liste (par mois)"
                    errors={errorCountBulkContact}
                    data={dataCountBulkContact}
                    formatedData={formatedDataCountBulkContact}
                    {...graphOptions}
                  />
                )}
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
                  Total nombre d’adresses testées par liste d’adresse
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
                {formatedDataVisits.length > 1 && (
                  <Graph
                    title="Nombre de visiteurs"
                    errors={errorVisits}
                    data={dataVisits}
                    formatedData={formatedDataVisits}
                    {...graphOptions}
                  />
                )}
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
                {formatedDataVisits.length > 1 && (
                  <Graph
                    title="Nombre de visiteurs sur la cartographie"
                    errors={errorVisitsMap}
                    data={dataVisitsMap}
                    formatedData={formatedDataVisitsMap}
                    {...graphOptions}
                  />
                )}
              </GraphsWrapper>
            </ColumnContainer>
          </Column>
          <Column className="fr-col-md-4 fr-col-12">
            <ColumnContainer>
              <NumberContainer>
                <NumberBlock>
                  <NumberHighlight>
                    {statistics.iFrameIntegration}
                  </NumberHighlight>
                  Intégrations de nos iframes
                </NumberBlock>
                <NumberBlock className="fr-mt-2w">
                  <NumberHighlight>{totalDownload}</NumberHighlight>
                  Téléchargements des tracés sur le site
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
