import { ReactNode } from 'react';

import Actors from './Contents/Actors';
import Advantages from './Contents/Advantages';
import Bill from './Contents/Bill';
import ClassedNetwork from './Contents/ClassedNetwork';
import ColdNetwork from './Contents/ColdNetwork';
import CoutRaccordement from './Contents/CoutRaccordement';
import Feasability from './Contents/Feasability';
import Fundings from './Contents/Fundings';
import GreenEnergies from './Contents/GreenEnergies';
import Helps from './Contents/Helps';
import History from './Contents/History';
import Livraisons from './Contents/Livraisons';
import Network from './Contents/Network';
import Priority from './Contents/Priority';
import Role from './Contents/Role';
import State from './Contents/State';
import Strengths from './Contents/Strengths';

export type Document = {
  title: string;
  altTitle?: string;
  description: ReactNode;
  seoDescription: string;
  seoTitle?: string;
  content: ReactNode;
};

// Don't forget to update next-sitemap.config on updating key here

export const issues: Record<string, Document> = {
  reseau: {
    title: 'Qu’est-ce qu’un réseau de chaleur ?',
    description: (
      <>
        Un réseau de chaleur est un{' '}
        <b>
          système de canalisations qui permettent d’acheminer vers un ensemble de bâtiments de la chaleur produite localement, à partir
          d’énergies renouvelables et de récupération.
        </b>
      </>
    ),
    seoDescription: 'Découvrez ce qu’est un réseau de chaleur et ses avantages pour l’environnement et les bâtiments.',
    content: <Network />,
  },
  'energies-vertes': {
    title: 'Les réseaux de chaleur : des énergies vertes',
    altTitle: 'Quelles énergies alimentent les réseaux de chaleur ?',
    description: (
      <>
        Les réseaux de chaleur français sont alimentés en moyenne à <b>62 % par des énergies renouvelables et de récupération locales.</b>
      </>
    ),
    seoDescription: 'Apprenez comment les réseaux de chaleur utilisent des énergies vertes pour réduire l’impact environnemental.',
    content: <GreenEnergies />,
  },
  atouts: {
    title: 'Un mode de chauffage aux multiples atouts',
    seoTitle: 'Les atouts des réseaux de chaleur (chauffage urbain)',
    description: (
      <>
        Se chauffer par un réseau de chaleur, c’est adopter un <b>mode de chauffage fiable</b> qui présente des bénéfices à la fois
        environnementaux, sanitaires, économiques et sociaux...
      </>
    ),
    seoDescription: 'Découvrez les nombreux avantages des réseaux de chaleur pour l’environnement et l’économie.',
    content: <Strengths />,
  },
  livraisons: {
    title: 'Que représentent les livraisons de chaleur par les réseaux en France ?',
    seoTitle: 'Livraisons de chaleur par les réseaux en France ',
    description: (
      <>
        Au niveau européen, la France ne se place qu’en 20ème position en termes de recours aux réseaux de chaleur,{' '}
        <b>avec environ 5 % des besoins en chaleur du pays couverts</b> par les réseaux.
      </>
    ),
    seoDescription: 'Analyse des livraisons de chaleur en France et leur contribution au chauffage national.',
    content: <Livraisons />,
  },
  histoire: {
    title: 'Quand et comment le chauffage urbain s’est-il développé en France ?',
    seoTitle: 'Quand le chauffage urbain s’est-il développé en France ?',
    description:
      'Les premiers réseaux de chaleur français ont vu le jour au début du 20ème siècle, où ils apparaissent  comme un moyen de lutter contre les nuisances du chauffage au charbon et au bois individuel (approvisionnement, pollution, incendies...).',
    seoDescription: 'Explorez l’histoire du chauffage urbain en France et son évolution depuis le 20ème siècle.',
    content: <History />,
  },
  role: {
    title: 'Un rôle clé dans la transition énergétique',
    seoTitle: 'Rôle du chauffage urbain dans la transition énergétique',
    altTitle: 'Quel est le rôle du chauffage urbain dans la transition énergétique ?',
    description: (
      <>
        Les bâtiments (résidentiels et tertiaires) sont responsables de près de la moitié des consommations d’énergie en France, et{' '}
        <b>de 15 % des émissions de gaz à effet de serre</b>, principalement dues au chauffage des bâtiments. Les réseaux de chaleur
        constituent un levier efficace pour réduire ces émissions.
      </>
    ),
    seoDescription: 'Découvrez comment les réseaux de chaleur jouent un rôle clé dans la transition énergétique en France.',
    content: <Role />,
  },
};

export const understandings: Record<string, Document> = {
  faisabilite: {
    title: 'Qu’est-ce qui détermine la faisabilité du raccordement ?',
    description: 'La faisabilité d’un raccordement dépend de certains critères techniques préalables.',
    seoTitle: 'Quels critères pour se raccorder à un réseau de chaleur ?',
    seoDescription: 'Découvrez les critères techniques déterminant la faisabilité d’un raccordement.',
    content: <Feasability />,
  },
  avantages: {
    title: 'Quels avantages par rapport à un chauffage collectif au gaz ou fioul ?',
    description: (
      <>
        Se raccorder à un réseau de chaleur, c’est <b>64 %</b> de réduction des émissions de gaz à effet de serre par rapport à un chauffage
        au fioul et <b>51 %</b> par rapport à un chauffage au gaz. Et ce n'est pas le seul avantage !
      </>
    ),
    seoTitle: 'Comparatif chauffage urbain vs. chaudière gaz ou fioul',
    seoDescription: 'Réduisez vos émissions de GES de 64 % (fioul) ou 51 % (gaz) en vous raccordant.',
    content: <Advantages />,
  },
  'cout-raccordement': {
    title: 'Combien coûte un raccordement ?',
    seoTitle: 'Combien coûte un raccordement à un réseau de chaleur ?',
    description: (
      <>
        Le raccordement d’un bâtiment à un réseau de chaleur présente un coût non négligeable. Toutefois, des aides permettent de le réduire
        fortement. De plus, l’investissement peut être rapidement amorti dès lors que le prix de la chaleur livrée par le réseau est
        compétitif.
      </>
    ),
    seoDescription: 'Le coût du raccordement peut être réduit grâce à des aides financières.',
    content: <CoutRaccordement />,
  },
  aides: {
    title:
      'Le coup de pouce chauffage des bâtiments résidentiels collectifs et tertiaires : une aide financière conséquente pour se raccorder',
    seoTitle: 'Aides pour se raccorder à un réseau de chaleur - CEE',
    altTitle: 'Quelles aides financières pour se raccorder ?',
    description: (
      <>
        Depuis le 1er septembre 2022, le coup de pouce <b>« Chauffage des bâtiments résidentiels collectifs et tertiaires »</b> permet de
        réduire significativement le coût du raccordement à un réseau de chaleur.
      </>
    ),
    seoDescription: 'Le coup de pouce chauffage réduit le coût de raccordement depuis septembre 2022.',
    content: <Helps />,
  },
  financement: {
    title: 'Financer le raccordement de sa copropriété dans le cadre d’une rénovation globale',
    seoTitle: 'Financer un raccordement au chauffage urbain (copropriété)',
    description:
      'Lorsque le raccordement au réseau de chaleur s’intègre dans des travaux de rénovation globale, des aides complémentaires au "Coup de pouce chauffage des bâtiments résidentiels collectifs et tertiaires" sont mobilisables.',
    seoDescription: 'Des aides complémentaires peuvent financer le raccordement dans une rénovation globale.',
    content: <Fundings />,
  },
  facture: {
    title: 'Comprendre la facture de chauffage de ma copropriété',
    description: (
      <>
        En raccordant mon immeuble à un réseau de chaleur, je bénéficie d’une <b>facture plus stable qu’avec un autre mode de chauffage.</b>
      </>
    ),
    seoDescription: 'Profitez d’une facture plus stable en raccordant votre immeuble à un réseau.',
    content: <Bill />,
  },
  'reseau-classe': {
    title: 'Qu’est-ce qu’un réseau classé ?',
    description:
      'Le classement d’un réseau instaure une obligation de raccordement pour certains bâtiments, dans une zone autour du réseau qualifiée de périmètre de développement prioritaire.',
    seoTitle: 'Obligations de raccordement aux réseaux de chaleur',
    seoDescription: 'Le classement d’un réseau peut rendre le raccordement obligatoire dans certaines zones.',
    content: <ClassedNetwork />,
  },
  prioritaire: {
    title: 'Mon bâtiment est situé dans le périmètre de développement prioritaire',
    seoTitle: 'Chauffage urbain, obligations de raccordement - réseau classé',
    description: (
      <>
        Quels bâtiments sont concernés par <b>l’obligation de raccordement ?</b>
      </>
    ),
    seoDescription: 'Quels bâtiments sont concernés par l’obligation de raccordement ?',
    content: <Priority />,
  },
};

export const growths: Record<string, Document> = {
  acteurs: {
    title: 'Quels sont les principaux acteurs de la filière ?',
    description: (
      <>
        Les réseaux de chaleur sont majoritairement établis à l’initiative de <b>collectivités territoriales</b>, mais leur gestion est le
        plus souvent concédée à des <b>opérateurs</b>, via des délégations de service public.
      </>
    ),
    seoTitle: 'Quels sont les principaux acteurs des réseaux de chaleur ?',
    seoDescription: 'Les collectivités lancent les réseaux, souvent gérés par des opérateurs en délégation.',
    content: <Actors />,
  },
  etat: {
    title: 'L’État investit dans les réseaux de chaleur',
    altTitle: "Par quels dispositifs financiers l'État soutient-il les réseaux de chaleur ?",
    description: 'Plusieurs dispositifs financiers sont mis en place par l’État pour accompagner le développement des réseaux de chaleur.',
    seoDescription: 'L’État soutient le développement des réseaux avec plusieurs dispositifs financiers.',
    content: <State />,
  },
};

export const coldNetworks: Record<string, Document> = {
  'reseau-de-froid': {
    title: 'Découvrir les réseaux de froid',
    description:
      'Un réseau de froid est constitué de canalisations souterraines qui permettent d’acheminer du froid vers un ensemble de bâtiments, avec une efficacité énergétique supérieure aux systèmes individuels ou collectifs centraux habituels. Les réseaux de froid sont majoritairement utilisés pour la climatisation des bâtiments tertiaires.',
    seoDescription: 'Les réseaux de froid offrent une climatisation efficace pour les bâtiments tertiaires.',
    content: <ColdNetwork />,
  },
};

export const ressourceKeys = [
  ...Object.keys(coldNetworks),
  ...Object.keys(growths),
  ...Object.keys(issues),
  ...Object.keys(understandings),
];

export const getRessource = (ressourceKey: keyof typeof ressourceKeys) => {
  return (
    issues[ressourceKey as keyof typeof issues] ||
    understandings[ressourceKey as keyof typeof understandings] ||
    growths[ressourceKey as keyof typeof growths] ||
    coldNetworks[ressourceKey as keyof typeof coldNetworks]
  );
};
