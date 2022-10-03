import Graph from '@components/Graph';
import Slice from '@components/Slice';
import TextList from '@components/TextList';
import { dataNumberFcu } from '@data';
import { useMemo } from 'react';
import useSWR from 'swr';
import Band from './Band';
import { Container, GraphsWrapper } from './Statistics.style';

type ReturnApiStatAirtable = {
  date: string;
  nbTotal: number;
  nbEligible: number;
  nbUneligible: number;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const Statistics = () => {
  const { data: rawDataEligibilityTest, error: errorDataEligibilityTest } =
    useSWR('/api/statistiques/actions', fetcher, {
      onError: (err) => console.warn('errorDataEligibilityTest >>', err),
    });

  const dataEligibilityTest = useMemo(
    () =>
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
        .reverse() ?? [],
    [rawDataEligibilityTest?.result]
  );

  const formatedDataEligibilityTest = [
    [
      { type: 'date', label: 'period' },
      'Total des tests',
      'Adresses non éligibles',
      'Adresses éligibles',
    ],
    ...dataEligibilityTest.map((entry: any) => {
      return [
        new Date(entry.filters.date),
        entry?.['Formulaire de test - Envoi']?.nb_visits || 0,
        entry?.['Formulaire de test - Adresse Inéligible']?.nb_visits || 0,
        entry?.['Formulaire de test - Adresse Éligible']?.nb_visits || 0,
      ];
    }),
  ];

  const { data: rawDataVisits, error: errorVisits } = useSWR(
    '/api/statistiques/visits',
    fetcher,
    {
      onError: (err) => console.warn('errorVisits >>', err),
    }
  );

  const dataVisits = useMemo(
    () =>
      rawDataVisits?.result.values
        .map((data: any, i: number) => ({
          filters: rawDataVisits.result.filters[i],
          ...data,
        }))
        .reverse() ?? [],
    [rawDataVisits?.result]
  );

  const formatedDataVisits = [
    [{ type: 'date', label: 'period' }, 'Visiteurs'],
    ...dataVisits.map((entry: any) => {
      return [new Date(entry.filters.date), entry.nb_uniq_visitors || 0];
    }),
  ];

  const { data: rawDataMonthContact, error: errorMonthContact } = useSWR(
    '/api/statistiques/contacts?group=monthly',
    fetcher,
    {
      onError: (err) => console.warn('errorMonthContact >>', err),
    }
  );

  const dataMonthContact = useMemo(
    () =>
      rawDataMonthContact
        ? Object.entries(
            (rawDataMonthContact as Record<string, ReturnApiStatAirtable>) || {}
          ).map(([key, value]) => {
            return {
              period: new Date(key),
              ...value,
            };
          })
        : undefined,
    [rawDataMonthContact]
  );

  const formatedDataMonthContact = [
    [
      { type: 'date', label: 'period' },
      'Total mensuel des prises de contact',
      'Contact mensuel pour adresses non éligibles',
      'Contact mensuel pour adresses éligibles',
    ],
    ...(dataMonthContact
      ? dataMonthContact.map((val) => {
          const { period, nbTotal, nbEligible, nbUneligible } = val;
          return [period, nbTotal || 0, nbUneligible || 0, nbEligible || 0];
        })
      : []),
  ];

  const { data: rawDataCountContact, error: errorCountContact } = useSWR(
    '/api/statistiques/contacts?group=all',
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
          ).map(([, { date, ...value }]) => {
            return {
              date: new Date(date),
              ...value,
            };
          })
        : undefined,
    [rawDataCountContact]
  );

  const formatedDataCountContact = [
    [
      { type: 'date', label: 'Date' },
      'Total des prises de contact',
      'Contact pour adresses non éligibles',
      'Contact pour adresses éligibles',
    ],
    ...(dataCountContact
      ? dataCountContact.map((val) => {
          const { date, nbTotal, nbEligible, nbUneligible } = val;
          return [date, nbTotal || 0, nbUneligible || 0, nbEligible || 0];
        })
      : []),
  ];

  return (
    <Container>
      <Slice padding={8}>
        <Slice padding={4}>
          <h2> Statistiques</h2>
          <span>
            En France, les besoins en chauffage ne sont couverts qu’à hauteur de
            5% par des réseaux de chaleur.
            <div>
              <b>
                Pourtant, ce mode de chauffage émet minimun 2 fois moins de gaz
                à effet de serre que le fioul ou le gaz
              </b>{' '}
              (source : SNCU).
            </div>
            <div>
              <b>
                La loi de transition énergétique pour la croissance verte fixe
                un objectif de multiplication par 5 de la quantité de chaud et
                de froid livrée par les réseaux en 2030, par rapport à 2012 :
                cela revient à 4 à 5 millions d’équivalent-logements
                supplémentaires à raccorder (estimation Amorce) !
              </b>
            </div>
          </span>
        </Slice>
        <Slice padding={4}>
          <Band />
        </Slice>
        <Slice padding={4}>
          <span>
            <i>
              Pour une consommation moyenne de 10 MWh/an, avec un réseau de
              chaleur alimenté à 60% par des énergies renouvelables (= taux
              moyen pour les réseaux de chaleur français)
            </i>
          </span>
        </Slice>
      </Slice>
      <Slice padding={8} theme="color">
        <h3>Au {dataNumberFcu.date}, France Chaleur Urbaine c’est :</h3>
        <TextList data={dataNumberFcu.data} />
        <i>{dataNumberFcu.note}</i>
      </Slice>
      <Slice padding={8}>
        <GraphsWrapper>
          <Graph
            title="Nombre de visiteurs / mois"
            errors={errorVisits}
            data={dataVisits}
            formatedData={formatedDataVisits}
          />
          <Graph
            title="Nombre d'adresses testées / mois"
            errors={errorDataEligibilityTest}
            data={dataEligibilityTest}
            formatedData={formatedDataEligibilityTest}
          />
          <Graph
            title="Demandes de contacts / mois"
            errors={errorMonthContact}
            data={dataMonthContact}
            formatedData={formatedDataMonthContact}
          />
          <Graph
            title="Demandes de contacts cumulées"
            errors={errorCountContact}
            data={dataCountContact}
            formatedData={formatedDataCountContact}
          />
        </GraphsWrapper>
      </Slice>
    </Container>
  );
};

export default Statistics;
