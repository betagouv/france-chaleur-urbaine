import Box, { ResponsiveRow } from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import Link from '@components/ui/Link';
import { Highlight } from '@dataesr/react-dsfr';
import { deepMergeObjects } from '@utils/core';
import { ComponentProps } from 'react';
import Chart from 'react-google-charts';
import { List } from './Contents.styles';
import SimulateurCoutRaccordement from './SimulateurCoutRaccordement';

type ChartOptions = ComponentProps<typeof Chart>['options'];

/**
 * Le contenu des infobulles (au survol) est surchargé pour maitriser son contenu.
 * Il y a besoin de mettre le contenu en dur si on veut garder le fonctionnement avec
 * react-google-charts.
 * Pour la coloration de la zone entre les 2 courbes, il faut créer des intervalles
 * avec les mêmes valeurs répétées pour que ça fonctionne bien.
 */

const commonGraphOptions: ComponentProps<typeof Chart>['options'] = {
  chartArea: {
    left: 85,
    right: 0,
    top: 40,
    bottom: 40,
  },
  hAxis: {
    title: 'Nombre de logements',
  },
  vAxis: {
    title: 'Coût de raccordement',
    format: '#,### €',
  },
  legend: 'none',

  // controls the area between the 2 lines
  intervals: { style: 'area', color: 'series-color' },
  interval: {
    i0: {
      fillOpacity: 0.1,
    },
  },
};

export const graphCoutRaccordementBatimentResidentielOptions = deepMergeObjects<
  any,
  ChartOptions
>(commonGraphOptions, {
  title: 'Coût de raccordement - bâtiment résidentiel',
  hAxis: {
    title: 'Nombre de logements',
  },
  colors: ['#000091'],
});

export const graphCoutRaccordementBatimentTertiaireOptions = deepMergeObjects<
  any,
  ChartOptions
>(commonGraphOptions, {
  title: 'Coût de raccordement - bâtiment tertiaire',
  hAxis: {
    title: 'Surface en m²',
    ticks: [2000, 5000, 10000, 15000], // manuel sinon seulement 1 seul tick à 10k...
  },
  colors: ['#f95c5e'],
});

export const graphCoutRaccordementBatimentResidentielData = [
  [
    { type: 'number', label: 'x' },
    { type: 'number', label: 'Fourchette basse' },
    { role: 'tooltip', type: 'string' },
    { type: 'number', label: 'Fourchette haute' },
    { role: 'tooltip', type: 'string' },
    { id: 'i0', type: 'number', role: 'interval' },
    { id: 'i1', type: 'number', role: 'interval' },
  ],
  [
    0,
    74_180,
    `Fourchette basse : 74 180 €`,
    111_269,
    `Fourchette haute : 111 269 €`,
    74_180,
    111_269,
  ],
  [
    10,
    74_180,
    `Fourchette basse : 74 180 €`,
    111_269,
    `Fourchette haute : 111 269 €`,
    74_180,
    111_269,
  ],
  [
    25,
    74_180,
    `Fourchette basse : 74 180 €`,
    111_269,
    `Fourchette haute : 111 269 €`,
    74_180,
    111_269,
  ],
  [
    42,
    79_442,
    `Fourchette basse : 79 442 €`,
    119_163,
    `Fourchette haute : 119 163 €`,
    79_442,
    119_163,
  ],
  [
    58,
    85_716,
    `Fourchette basse : 85 716 €`,
    128_575,
    `Fourchette haute : 128 575 €`,
    85_716,
    128_575,
  ],
  [
    83,
    92_497,
    `Fourchette basse : 92 497 €`,
    138_745,
    `Fourchette haute : 138 745 €`,
    92_497,
    138_745,
  ],
  [
    125,
    102_718,
    `Fourchette basse : 102 718 €`,
    154_077,
    `Fourchette haute : 154 077 €`,
    102_718,
    154_077,
  ],
  [
    167,
    114_457,
    `Fourchette basse : 114 457 €`,
    171_686,
    `Fourchette haute : 171 686 €`,
    114_457,
    171_686,
  ],
  [
    250,
    140_162,
    `Fourchette basse : 140 162 €`,
    210_243,
    `Fourchette haute : 210 243 €`,
    140_162,
    210_243,
  ],
  [
    333,
    161_920,
    `Fourchette basse : 161 920 €`,
    242_880,
    `Fourchette haute : 242 880 €`,
    161_920,
    242_880,
  ],
];

export const graphCoutRaccordementBatimentTertiaireData = [
  [
    { type: 'number', label: 'x' },
    { type: 'number', label: 'Fourchette basse' },
    { role: 'tooltip', type: 'string' },
    { type: 'number', label: 'Fourchette haute' },
    { role: 'tooltip', type: 'string' },
    { id: 'i0', type: 'number', role: 'interval' },
    { id: 'i1', type: 'number', role: 'interval' },
  ],
  [
    0,
    74_180,
    `Fourchette basse : 74 180 €`,
    111_269,
    `Fourchette haute : 111 269 €`,
    74_180,
    111_269,
  ],
  [
    200,
    74_180,
    `Fourchette basse : 74 180 €`,
    111_269,
    `Fourchette haute : 111 269 €`,
    74_180,
    111_269,
  ],
  [
    600,
    74_180,
    `Fourchette basse : 74 180 €`,
    111_269,
    `Fourchette haute : 111 269 €`,
    74_180,
    111_269,
  ],
  [
    1_000,
    74_180,
    `Fourchette basse : 74 180 €`,
    111_269,
    `Fourchette haute : 111 269 €`,
    74_180,
    111_269,
  ],
  [
    1_500,
    74_180,
    `Fourchette basse : 74 180 €`,
    111_269,
    `Fourchette haute : 111 269 €`,
    74_180,
    111_269,
  ],
  [
    2_500,
    79_442,
    `Fourchette basse : 79 442 €`,
    119_163,
    `Fourchette haute : 119 163 €`,
    79_442,
    119_163,
  ],
  [
    3_500,
    85_716,
    `Fourchette basse : 85 716 €`,
    128_575,
    `Fourchette haute : 128 575 €`,
    85_716,
    128_575,
  ],
  [
    5_000,
    92_497,
    `Fourchette basse : 92 497 €`,
    138_745,
    `Fourchette haute : 138 745 €`,
    92_497,
    138_745,
  ],
  [
    7_500,
    102_718,
    `Fourchette basse : 102 718 €`,
    154_077,
    `Fourchette haute : 154 077 €`,
    102_718,
    154_077,
  ],
  [
    10_000,
    114_457,
    `Fourchette basse : 114 457 €`,
    171_686,
    `Fourchette haute : 171 686 €`,
    114_457,
    171_686,
  ],
  [
    15_000,
    140_162,
    `Fourchette basse : 140 162 €`,
    210_243,
    `Fourchette haute : 210 243 €`,
    140_162,
    210_243,
  ],
  [
    20_000,
    161_920,
    `Fourchette basse : 161 920 €`,
    242_880,
    `Fourchette haute : 242 880 €`,
    161_920,
    242_880,
  ],
];

const CoutRaccordement = () => {
  return (
    <>
      <Heading size="h3" color="blue-france">
        Estimation des coûts
      </Heading>
      <p>
        Des estimations de coûts de raccordement pour une longueur de
        branchement de 50m sont présentées ci-dessous :
      </p>
      <ResponsiveRow breakpoint="xl">
        <Chart
          height="400px"
          width="100%"
          chartType="LineChart"
          chartLanguage="FR-fr"
          loader={<div>Chargement du graphe...</div>}
          data={graphCoutRaccordementBatimentResidentielData}
          options={graphCoutRaccordementBatimentResidentielOptions}
        />
        <Chart
          height="400px"
          width="100%"
          chartType="LineChart"
          chartLanguage="FR-fr"
          loader={<div>Chargement du graphe...</div>}
          data={graphCoutRaccordementBatimentTertiaireData}
          options={graphCoutRaccordementBatimentTertiaireOptions}
        />
      </ResponsiveRow>
      <br />
      Ces estimations sont basées sur l’hypothèse de puissances de :
      <ul>
        <li>0.2 kW/m² pour le tertiaire</li>
        <li>12 kW/logement pour le résidentiel</li>
      </ul>
      <p>
        A noter que le coup de pouce{' '}
        <Link href="/ressources/aides#contenu">
          "Chauffage des bâtiments résidentiels collectifs et tertiaires”
        </Link>{' '}
        permet d’obtenir des aides financières conséquentes pour se raccorder.
        Le coût du raccordement peut ainsi être réduit à quelques centaines
        d’euros par logement.
      </p>
      <SimulateurCoutRaccordement />
      <Heading size="h3" color="blue-france" mt="4w">
        Quels facteurs peuvent influencer ces coûts ?
      </Heading>
      <p>
        Les coûts de raccordement peuvent fortement fluctuer en fonction de
        différents facteurs :
      </p>
      <List>
        <li>
          La taille de l’échangeur : elle dépend de la puissance nécessaire,
          également appelée puissance souscrite, stipulée et contractualisée
          dans le contrat d'abonnement. Un échangeur plus puissant nécessite
          davantage de matériaux, ce qui se traduit par un coût plus élevé. La
          puissance souscrite est définie par des facteurs tels que la taille du
          bâtiment, son niveau d'isolation et le climat de son emplacement.
        </li>
        <li>
          La longueur de branchement : nécessaire pour raccorder le bâtiment,
          cette mesure est également influencée par des contraintes sur la
          voirie, incluant des considérations telles que les types de matériaux,
          les détours nécessaires, et la présence d'autres réseaux.
        </li>
        <li>
          Des difficultés et contraintes de raccordement :
          <ul>
            <li>La nature du terrain : pleine terre, enrobé, trottoirs…</li>
            <li>La présence d’obstacles aériens : mobiliers urbains ;</li>
            <li>
              La présence d’obstacles souterrains : si les travaux de
              terrassement rencontrent des réseaux d’assainissement, de gaz ou
              des câbles électriques imprévus, il peut être nécessaire de les
              déplacer ou de les protéger. Ces travaux supplémentaires peuvent
              augmenter les coûts de raccordement.
            </li>
            <li>
              La présence de vestiges archéologiques : les opérations de
              terrassement requises pour le raccordement peuvent révéler des
              vestiges archéologiques, ce qui impose la conduite de fouilles
              archéologiques. Ces fouilles sont menées par des experts
              professionnels dont la tâche consiste à préserver et à examiner
              ces vestiges. Elles peuvent entraîner des coûts supplémentaires en
              raison des retards causés par les fouilles.
            </li>
          </ul>
        </li>
        <li>
          Les travaux à réaliser dans le local sous-station :
          <ul>
            <li>
              En rez-de-chaussée, la sous-station est généralement plus facile à
              installer et à maintenir. En effet, le rez-de-chaussée est le plus
              souvent un lieu accessible et bien ventilé, ce qui facilite
              l'installation des équipements et la maintenance de la
              sous-station. De plus, les travaux de génie civil nécessaires pour
              relier la sous-station au réseau sont généralement moins coûteux
              que sur une toiture.
            </li>
            <li>
              En toiture ou en sous-sol, la sous-station est généralement plus
              coûteuse à installer et à maintenir. En effet, la sous-station est
              alors plus difficile d'accès, ce qui peut compliquer
              l'installation des équipements et la maintenance. De plus, les
              travaux hydrauliques nécessaires pour relier la sous-station au
              réseau sont généralement plus coûteux que sur un rez-de-chaussée
            </li>
          </ul>
        </li>
      </List>
      <Highlight>
        <Box py="1w">
          L’ensemble des informations de cet article sont fournies par la{' '}
          <Link
            href="https://fedene.fr/mission/reseaux-de-chaleur-et-de-froid/"
            isExternal
          >
            Fedene Réseaux de chaleur & Froid
          </Link>
          .
        </Box>
      </Highlight>
    </>
  );
};

export default CoutRaccordement;
