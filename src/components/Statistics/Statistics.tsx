import Graph from '@components/Graph';
import Slice from '@components/Slice';
import TextList from '@components/TextList';
import { dataNumberFcu } from '@data';
import { useMemo } from 'react';
import useSWR from 'swr';
import Band from './Band';
import { Container, GraphsWrapper } from './Statistics.style';

type NbVisitType = { nb_visits?: number | string };
type ReturnApiMatomo = {
  filters?: { date?: string };
  nb_uniq_visitors?: string;
  'Formulaire de test - Envoi'?: NbVisitType;
  'Formulaire de test - Adresse Inéligible'?: NbVisitType;
  'Formulaire de test - Adresse Éligible'?: NbVisitType;
  'Formulaire de contact éligible - Envoi'?: NbVisitType;
  'Formulaire de contact inéligible - Envoi'?: NbVisitType;
};
type ReturnApiStatAirtable = {
  date: string;
  nbTotal: number;
  nbEligible: number;
  nbUneligible: number;
};

const monthToString = [
  'Jan',
  'Fev',
  'Mar',
  'Avr',
  'Mai',
  'Juin',
  'Juil',
  'Aout',
  'Sept',
  'Oct',
  'Nov',
  'Dec',
];

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const Statistics = () => {
  const { data: rawDataActions, error: errorActions } = useSWR(
    '/api/statistiques/getActions',
    fetcher
  );
  const { data: rawDataVisits, error: errorVisits } = useSWR(
    '/api/statistiques/getVisitsSummary',
    fetcher
  );
  const { data: rawDataCountContact, error: errorCountContact } = useSWR(
    '/api/statistiques/getCountContact',
    fetcher
  );

  if (errorActions) console.warn('errorActions >>', errorActions);
  const dataActions = useMemo(
    () =>
      rawDataActions?.result.values
        .map((arr: any[], i: number) =>
          arr.reduce(
            (acc, entry) => {
              return {
                ...acc,
                [entry.label]: entry,
              };
            },
            { filters: rawDataActions?.result.filters[i] }
          )
        )
        .reverse() ?? [],
    [rawDataActions?.result]
  );
  const dataEligibilityTest = dataActions;

  if (errorVisits) console.warn('errorVisits >>', errorVisits);
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

  if (errorCountContact)
    console.warn('errorCountContact >>', errorCountContact);
  const dataCountContact = useMemo(
    () =>
      Object.entries(
        (rawDataCountContact as Record<string, ReturnApiStatAirtable>) || {}
      ).map(([, value]) => value),
    [rawDataCountContact]
  );

  const formatedDataVisits = [
    ['x', 'Visiteurs'],
    ...dataVisits.map((entry: ReturnApiMatomo = {}) => {
      const [year, month] = entry?.filters?.date?.split('-') || ['YYYY', 'MM'];
      const label = `${
        !isNaN(Number(month)) ? monthToString[parseInt(month) - 1] : month
      } ${year}`;
      return [label, entry?.nb_uniq_visitors || 0];
    }),
  ];

  const formatedDataEligibilityTest = [
    ['x', 'Total des tests', 'Adresses non éligibles', 'Adresses éligibles'],
    ...dataEligibilityTest.map((entry: ReturnApiMatomo = {}) => {
      const [year, month] = entry?.filters?.date?.split('-') || ['YYYY', 'MM'];
      const label = `${
        !isNaN(Number(month)) ? monthToString[Number(month) - 1] : month
      } ${year}`;
      return [
        label,
        entry?.['Formulaire de test - Envoi']?.nb_visits || 0,
        entry?.['Formulaire de test - Adresse Inéligible']?.nb_visits || 0,
        entry?.['Formulaire de test - Adresse Éligible']?.nb_visits || 0,
      ];
    }),
  ];

  const formatedDataContact = [
    [
      'x',
      'Total des prises de contact',
      'Contact pour adresses non éligibles',
      'Contact pour adresses éligibles',
    ],
    ...dataEligibilityTest.map((entry: ReturnApiMatomo = {}) => {
      const [year, month] = entry?.filters?.date?.split('-') || ['YYYY', 'MM'];
      const label = `${
        !isNaN(Number(month)) ? monthToString[Number(month) - 1] : month
      } ${year}`;
      const eligible =
        entry?.['Formulaire de contact éligible - Envoi']?.nb_visits || 0;
      const ineligible =
        entry?.['Formulaire de contact inéligible - Envoi']?.nb_visits || 0;
      const total = Number(eligible) + Number(ineligible);
      return [label, total, ineligible, eligible];
    }),
  ];

  const formatedDataSumContact = [
    [
      { type: 'date', label: 'Date' },
      'Total des prises de contact',
      'Contact pour adresses non éligibles',
      'Contact pour adresses éligibles',
    ],
    ...dataCountContact.map((val) => {
      const { date, nbTotal, nbEligible, nbUneligible } = val;
      const [year, month, day] = date.split('-');
      return [
        new Date(Date.UTC(+year, +month - 1, +day)),
        nbTotal || 0,
        nbUneligible || 0,
        nbEligible || 0,
      ];
    }),
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
            title="Nombre de visiteurs/mois"
            errors={errorVisits}
            data={dataVisits}
            formatedData={formatedDataVisits}
          />
          <Graph
            title="Adresses testées"
            errors={errorActions}
            data={dataEligibilityTest}
            formatedData={formatedDataEligibilityTest}
          />
          <Graph
            title="Demandes de contacts mensuelles"
            errors={errorActions}
            data={dataEligibilityTest}
            formatedData={formatedDataContact}
          />
          <Graph
            title="Demandes de contacts cumulées"
            errors={errorCountContact}
            data={dataCountContact}
            formatedData={formatedDataSumContact}
          />
        </GraphsWrapper>
      </Slice>
    </Container>
  );
};

export default Statistics;
