import MainLayout from '@components/shared/layout/MainLayout';
import Slice from '@components/Slice';
import TextList from '@components/TextList';
import { dataNumberFcu, dataNumberRcu } from '@data';
import Head from 'next/head';
import React, { useMemo } from 'react';
import Chart from 'react-google-charts';
import styled from 'styled-components';
import useSWR from 'swr';

const GraphWrapper = styled.div`
  width: 100%;
  height: 400px;
`;

const textDataKey = dataNumberRcu.map(({ value, description }) => ({
  title: value,
  body: description,
}));

const fcuDataKey = dataNumberFcu.map(({ value, description }) => ({
  title: value,
  body: description,
}));

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

function Statistiques() {
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
      const uneligible =
        entry?.['Formulaire de contact inéligible - Envoi']?.nb_visits || 0;
      const total = Number(eligible) + Number(uneligible);
      return [label, total, uneligible, eligible];
    }),
  ];

  return (
    <>
      <Head>
        <title>Statistiques - France Chaleur Urbaine</title>
      </Head>
      <MainLayout>
        <div className="fr-container fr-mt-2w">
          <div className="fr-grid-row">
            <div className="fr-col-12">
              <h2>Statistiques</h2>
              <ul>
                <li>
                  Ouverture nationale de la plateforme&nbsp;: juillet 2021
                </li>
                <li>
                  Mise en place des mesures statistiques automatisées&nbsp;:
                  décembre 2021
                </li>
                <li>
                  Fréquence de mise à jour des statistiques automatisées&nbsp;:
                  Mensuelle
                </li>
              </ul>
              <p></p>

              <h3>Nombre de visiteurs</h3>
              <GraphWrapper>
                {errorVisits ? (
                  <div>
                    Erreur lors du chargement des données statistique, veuillez
                    nous excuser et re-essayer plus tard.
                  </div>
                ) : !dataVisits || !formatedDataVisits ? (
                  'Chargement des données...'
                ) : (
                  <Chart
                    height={'400px'}
                    chartType="LineChart"
                    loader={<div>Loading Chart</div>}
                    data={formatedDataVisits}
                    options={{
                      legend: 'none',
                      colors: ['#0078f3', '#f60700', '#1f8d49'],
                      hAxis: {
                        slantedText: true,
                        slantedTextAngle: 30,
                      },
                      vAxis: {
                        title: 'Visiteurs',
                        viewWindow: {
                          min: -50,
                        },
                      },
                      animation: {
                        startup: true,
                        easing: 'out',
                        duration: 500,
                      },
                    }}
                    rootProps={{ 'data-testid': '1' }}
                  />
                )}
              </GraphWrapper>
              <p></p>

              <h3>Adresses testées</h3>
              <p>
                <em>
                  Les adresses testées avant décembre 2021 n’étant pas
                  comptabilisées de façon automatisée, elles ne sont pas
                  affichées sur ce graphique. Cependant, une solution permettant
                  d’exposer ces données est en cours d’étude.
                </em>
              </p>
              <GraphWrapper>
                {errorActions ? (
                  <div>
                    Erreur lors du chargement des données statistique, veuillez
                    nous excuser et re-essayer plus tard.
                  </div>
                ) : !dataEligibilityTest ? (
                  'Chargement des données...'
                ) : (
                  <Chart
                    height={'400px'}
                    chartType="LineChart"
                    loader={<div>Loading Chart</div>}
                    data={formatedDataEligibilityTest}
                    options={{
                      colors: ['#0078f3', '#f60700', '#1f8d49', '#009099'],
                      hAxis: {
                        slantedText: true,
                        slantedTextAngle: 30,
                      },
                      vAxis: {
                        viewWindow: {
                          min: -8,
                        },
                      },
                      animation: {
                        startup: true,
                        easing: 'out',
                        duration: 500,
                      },
                    }}
                    rootProps={{ 'data-testid': '2' }}
                  />
                )}
              </GraphWrapper>
              <p></p>

              <h3>Demandes de contacts</h3>
              <p>
                <em>
                  Les demandes de contacts effectuées avant décembre 2021
                  n’étant pas comptabilisées de façon automatisée, elles ne sont
                  pas affichées sur ce graphique. Cependant, une solution
                  permettant d’exposer ces données est en cours d’étude.
                </em>
              </p>
              <p>
                <em>
                  <strong>Données antérieures à décembre 2021&nbsp;:</strong>
                  <br />
                  <strong>Nombre de demandes de contacts&nbsp;:</strong>
                  <span>&nbsp;• juillet&nbsp;:&nbsp;2 </span>
                  <span>&nbsp;• septembre&nbsp;:&nbsp;5 </span>
                  <span>&nbsp;• octobre&nbsp;:&nbsp;6 </span>
                  <span>&nbsp;• novembre&nbsp;:&nbsp;4 </span>
                </em>
              </p>

              <GraphWrapper>
                {errorActions ? (
                  <div>
                    Erreur lors du chargement des données statistique, veuillez
                    nous excuser et re-essayer plus tard.
                  </div>
                ) : !dataContact ? (
                  'Chargement des données...'
                ) : (
                  <Chart
                    height={'400px'}
                    chartType="LineChart"
                    loader={<div>Loading Chart</div>}
                    data={formatedDataContact}
                    options={{
                      colors: ['#0078f3', '#f60700', '#1f8d49'],
                      hAxis: {
                        slantedText: true,
                        slantedTextAngle: 30,
                      },
                      vAxis: {
                        viewWindow: {
                          min: -0.08,
                        },
                        gridlines: {
                          multiple: 1,
                        },
                        minorGridlines: {
                          multiple: 0.25,
                        },
                      },
                      animation: {
                        startup: true,
                        easing: 'out',
                        duration: 500,
                      },
                    }}
                    rootProps={{ 'data-testid': '3' }}
                  />
                )}
              </GraphWrapper>
              <p></p>

              <h3>
                Taux de conversion d’un chauffage fossile vers les réseaux de
                chaleur
              </h3>
              <Slice padding={0}>
                <TextList data={fcuDataKey} />
              </Slice>
              <p></p>

              <h3>À propos des réseaux de chaleur</h3>
              <div>
                <em>
                  Source : SNCU, Enquête annuelle sur les réseaux de chaleur et
                  de froid 2021
                </em>
              </div>
              <Slice padding={0}>
                <TextList data={textDataKey} />
              </Slice>
              <p></p>
            </div>
          </div>
        </div>
      </MainLayout>
    </>
  );
}

export default Statistiques;
