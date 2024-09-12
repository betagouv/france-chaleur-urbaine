import { useMemo } from 'react';
import useSWR from 'swr';

import Graph from '@components/Graph';
import Slice from '@components/Slice';
import TextList from '@components/TextList';
import { dataNumberFcu } from '@data';
import { fetchJSON } from '@utils/network';
import { STAT_LABEL } from 'src/types/enum/MatomoStats';

import Band from './Band';
import { Container, GraphsWrapper } from './StatisticsV1.style';

type ReturnApiStatAirtable = {
  date: string;
  nbTotal: number;
  nbEligible: number;
  nbUneligible: number;
};

const monthToString = [
  'janvier',
  'fevrier',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'aout',
  'septembre',
  'octobre',
  'novembre',
  'decembre',
];

const Statistics = () => {
  const { data: dataActions, error: errorDataActions } = useSWR<any>('/api/statistiques/actions', fetchJSON, {
    onError: (err) => console.warn('errorDataActions >>', err),
  });

  const formatedDataEligibilityTest = [
    ['x', 'Total des tests', 'Adresses non éligibles', 'Adresses éligibles'],
    ...(dataActions ?? []).map((entry: any) => {
      const [year, month] = entry?.date?.split('-') || ['YYYY', 'MM'];
      const label = `${!isNaN(Number(month)) ? monthToString[parseInt(month) - 1] : month} ${year}`;
      return [
        label,
        (entry[STAT_LABEL.FORM_TEST_UNELIGIBLE] ?? 0) +
          (entry[STAT_LABEL.FORM_TEST_CARTE_UNELIGIBLE] ?? 0) +
          (entry[STAT_LABEL.FORM_TEST_FICHE_RESEAU_UNELIGIBLE] ?? 0) +
          (entry[STAT_LABEL.FORM_TEST_ELIGIBLE] ?? 0) +
          (entry[STAT_LABEL.FORM_TEST_CARTE_ELIGIBLE] ?? 0) +
          (entry[STAT_LABEL.FORM_TEST_FICHE_RESEAU_ELIGIBLE] ?? 0),
        (entry[STAT_LABEL.FORM_TEST_UNELIGIBLE] ?? 0) +
          (entry[STAT_LABEL.FORM_TEST_CARTE_UNELIGIBLE] ?? 0) +
          (entry[STAT_LABEL.FORM_TEST_FICHE_RESEAU_UNELIGIBLE] ?? 0),
        (entry[STAT_LABEL.FORM_TEST_ELIGIBLE] ?? 0) +
          (entry[STAT_LABEL.FORM_TEST_CARTE_ELIGIBLE] ?? 0) +
          (entry[STAT_LABEL.FORM_TEST_FICHE_RESEAU_ELIGIBLE] ?? 0),
      ];
    }),
  ];

  const { data: dataVisits, error: errorVisits } = useSWR<any>('/api/statistiques/visits', fetchJSON, {
    onError: (err) => console.warn('errorVisits >>', err),
  });

  const formatedDataVisits = [
    ['x', 'Visiteurs'],
    ...(dataVisits ?? []).map((entry: any) => {
      if (entry) {
        const [year, month] = entry?.date?.split('-') || ['YYYY', 'MM'];
        const label = `${!isNaN(Number(month)) ? monthToString[parseInt(month) - 1] : month} ${year}`;
        return [label, entry.value || 0];
      }
    }),
  ];

  //From Airtable
  const { data: dataMonthContact, error: errorMonthContact } = useSWR<any>('/api/statistiques/contacts?group=monthly', fetchJSON, {
    onError: (err) => console.warn('errorMonthContact >>', err),
  });

  const formatedDataMonthContact = [
    ['x', 'Total des prises de contact', 'Contact pour adresses non éligibles', 'Contact pour adresses éligibles'],
    ...(dataMonthContact
      ? dataMonthContact.map((val: any) => {
          const { date, nbTotal, nbEligible, nbUneligible } = val;
          const [year, month] = date.split('-') || ['YYYY', 'MM'];
          const label = `${!isNaN(Number(month)) ? monthToString[parseInt(month) - 1] : month} ${year}`;

          return [label, nbTotal || 0, nbUneligible || 0, nbEligible || 0];
        })
      : []),
  ];

  //From Airtable
  const { data: rawDataCountContact, error: errorCountContact } = useSWR<any>('/api/statistiques/contacts?group=all', fetchJSON, {
    onError: (err) => console.warn('errorCountContact >>', err),
  });

  const dataCountContact = useMemo(
    () =>
      rawDataCountContact
        ? Object.entries((rawDataCountContact as Record<string, ReturnApiStatAirtable>) || {}).map(([, { date, ...value }]) => {
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

  const { data: dataCountBulkContact, error: errorCountBulkContact } = useSWR<any>('/api/statistiques/bulk', fetchJSON, {
    onError: (err) => console.warn('errorCountContact >>', err),
  });

  const formatedDataCountBulkContact = [
    ['x', 'Total des tests', 'Adresses non éligibles', 'Adresses éligibles'],
    ...(dataCountBulkContact
      ? dataCountBulkContact.map((val: any) => {
          const { date, nbTotal, nbEligible, nbUneligible } = val;
          const [year, month] = date.split('-') || ['YYYY', 'MM'];
          const label = `${!isNaN(Number(month)) ? monthToString[parseInt(month) - 1] : month} ${year}`;

          return [label, nbTotal || 0, nbUneligible || 0, nbEligible || 0];
        })
      : []),
  ];

  return (
    <Container>
      <Slice padding={8}>
        <Slice padding={4}>
          <h2> Statistiques</h2>
          <span>
            En France, les besoins en chauffage ne sont couverts qu’à hauteur de 5% par des réseaux de chaleur.
            <div>
              <b>Pourtant, ce mode de chauffage émet au minimum 2 fois moins de gaz à effet de serre que le fioul ou le gaz</b> (source :
              SNCU).
            </div>
            <div>
              <b>
                La loi de transition énergétique pour la croissance verte fixe un objectif de multiplication par 5 de la quantité de chaud
                et de froid livrée par les réseaux en 2030, par rapport à 2012 : cela revient à 4 à 5 millions d’équivalent-logements
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
              Pour une consommation moyenne de 10 MWh/an, avec un réseau de chaleur alimenté à 62% par des énergies renouvelables (= taux
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
          {formatedDataVisits.length > 1 && (
            <Graph
              title="Nombre de visiteurs / mois"
              error={errorVisits}
              data={dataVisits}
              formatedData={formatedDataVisits}
              large
              withSum
            />
          )}
          {formatedDataEligibilityTest.length > 1 && (
            <Graph
              title="Nombre d'adresses testées / mois"
              error={errorDataActions}
              data={dataActions}
              formatedData={formatedDataEligibilityTest}
              withSum
            />
          )}
          <Graph
            title="Adresses testées par liste / mois"
            error={errorCountBulkContact}
            data={dataCountBulkContact}
            formatedData={formatedDataCountBulkContact}
            withSum
          />
          <Graph
            title="Demandes de contacts / mois"
            error={errorMonthContact}
            data={dataMonthContact}
            formatedData={formatedDataMonthContact}
          />
          <Graph
            title="Demandes de contacts cumulées"
            error={errorCountContact}
            data={dataCountContact}
            formatedData={formatedDataCountContact}
          />
        </GraphsWrapper>
      </Slice>
    </Container>
  );
};

export default Statistics;
