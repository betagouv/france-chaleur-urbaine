import Graph from '@components/Graph/Graph';
import { Graphs } from '@components/Graph/Graph.style';
import Slice from '@components/Slice';
import TextList from '@components/TextList';
import { dataNumberFcu, dataNumberRcu } from '@data';
import { useMemo } from 'react';
import useSWR from 'swr';
import Band from './Band';
import { Container, Subtitle } from './Statistics.style';

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
  const dataContact = dataActions;

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

  type returnApi = {
    filters?: { date?: string };
    nb_uniq_visitors?: string;
    'Formulaire de test - Envoi'?: { nb_visits?: number | string };
    'Formulaire de test - Adresse Inéligible'?: { nb_visits?: number | string };
    'Formulaire de test - Adresse Éligible'?: { nb_visits?: number | string };
    'Formulaire de contact éligible - Envoi'?: { nb_visits?: number | string };
    'Formulaire de contact inéligible - Envoi'?: {
      nb_visits?: number | string;
    };
  };

  const formatedDataVisits = [
    ['x', 'Visiteurs'],
    ...dataVisits.map((entry: returnApi = {}) => {
      const [year, month] = entry?.filters?.date?.split('-') || ['YYYY', 'MM'];
      const label = `${
        !isNaN(Number(month)) ? monthToString[parseInt(month) - 1] : month
      } ${year}`;
      return [label, entry?.nb_uniq_visitors || 0];
    }),
  ];

  const formatedDataEligibilityTest = [
    ['x', 'Total des tests', 'Adresse non éligibles', 'Adresse éligibles'],
    ...dataEligibilityTest.map((entry: returnApi = {}) => {
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
      'Contact pour adresse non éligibles',
      'Contact pour adresse éligibles',
    ],
    ...dataContact.map((entry: returnApi = {}) => {
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
  return (
    <Container>
      <Slice padding={8}>
        <Slice padding={4}>
          <h2> Statistiques</h2>
          <span>
            En France, les besoins en chauffage ne sont couverts qu’à hauteur de
            5% par des réseaux de chaleur.
            <br />
            <b>
              Pourtant, ce mode de chauffage émet minimun 2 fois moins de gaz à
              effet de serre que le fioul ou le gaz (source : SNCU).
            </b>
          </span>
        </Slice>
        <Slice padding={4}>
          <Band />
        </Slice>
        <Slice padding={4}>
          <span>
            <b>
              Le potentiel de logements raccordables est estimé à 4 à 5 millions
              !
            </b>
            <br />
            Cependant les copropriétaires n’ont actuellement pas un accès facile
            aux informations dont ils ont besoin pour étudier l’opportunité d’un
            raccordement et ce malgré l’interdition du renouvellement des
            chaudières au fioul.
          </span>
        </Slice>
      </Slice>
      <Slice padding={8} theme="color">
        <h3>Les réseaux de chaleurs</h3>
        <TextList data={dataNumberRcu} />
      </Slice>
      <Slice padding={8}>
        <h3>France Chaleur Urbaine c’est :</h3>
        <Subtitle>Au 1er février 2022 :</Subtitle>
        <TextList data={dataNumberFcu} />
        <span>
          Par raccordements à l’étude, on désigne ceux pour lesquels une étude
          de faisabilité technico-économique est en cours au niveau du
          gestionnaire du réseau. La proposition du gestionnaire devra ensuite
          être votée en AG de la copropriété avant que les travaux ne puissent
          démarrer.
        </span>
      </Slice>
      <Slice padding={8}>
        <Graphs>
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
            title="Demandes de contacts"
            errors={errorActions}
            data={dataContact}
            formatedData={formatedDataContact}
          />
        </Graphs>
      </Slice>
    </Container>
  );
};

export default Statistics;
