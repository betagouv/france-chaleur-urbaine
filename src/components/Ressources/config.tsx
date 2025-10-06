import type { ReactNode } from 'react';

import Actors from './Contents/Actors';
import Advantages from './Contents/Advantages';
import Bill from './Contents/Bill';
import ClassedNetwork from './Contents/ClassedNetwork';
import ColdNetwork from './Contents/ColdNetwork';
import CoutRaccordement from './Contents/CoutRaccordement';
import DispositifEcoEnergieTertiaire from './Contents/dispositif-eco-energie-tertiaire.mdx';
import Feasability from './Contents/Feasability';
import Fundings from './Contents/Fundings';
import GreenEnergies from './Contents/GreenEnergies';
import Helps from './Contents/Helps';
import History from './Contents/History';
import Livraisons from './Contents/Livraisons';
import Network from './Contents/Network';
import ObligationsRaccordement from './Contents/obligations-raccordement.mdx';
import Role from './Contents/Role';
import State from './Contents/State';
import Strengths from './Contents/Strengths';

export type Document = {
  title: string;
  altTitle?: string;
  description: ReactNode;
  seoDescription: string;
  seoTitle?: string;
  content?: ReactNode;
};

// Don't forget to update next-sitemap.config on updating key here

export const issues: Record<string, Document> = {
  atouts: {
    content: <Strengths />,
    description: (
      <>
        Se chauffer par un réseau de chaleur, c’est adopter un <b>mode de chauffage fiable</b> qui présente des bénéfices à la fois
        environnementaux, sanitaires, économiques et sociaux...
      </>
    ),
    seoDescription: 'Découvrez les nombreux avantages des réseaux de chaleur : environnement, économie, emploi, santé…',
    seoTitle: 'Les atouts des réseaux de chaleur (chauffage urbain)',
    title: 'Un mode de chauffage aux multiples atouts',
  },
  'energies-vertes': {
    altTitle: 'Quelles énergies alimentent les réseaux de chaleur ?',
    content: <GreenEnergies />,
    description: (
      <>
        Les réseaux de chaleur français sont alimentés en moyenne à <b>62 % par des énergies renouvelables et de récupération locales.</b>
      </>
    ),
    seoDescription: 'Les réseaux de chaleur, un mode de chauffage écologique exploitant des énergies renouvelables et de récupération.',
    title: 'Les réseaux de chaleur : des énergies vertes',
  },
  histoire: {
    content: <History />,
    description:
      'Les premiers réseaux de chaleur français ont vu le jour au début du 20ème siècle, où ils apparaissent  comme un moyen de lutter contre les nuisances du chauffage au charbon et au bois individuel (approvisionnement, pollution, incendies...).',
    seoDescription: 'Explorez l’histoire du chauffage urbain en France et son évolution depuis le 20ème siècle.',
    seoTitle: 'Quand le chauffage urbain s’est-il développé en France ?',
    title: 'Quand et comment le chauffage urbain s’est-il développé en France ?',
  },
  livraisons: {
    content: <Livraisons />,
    description: (
      <>
        Au niveau européen, la France ne se place qu’en 20ème position en termes de recours aux réseaux de chaleur,{' '}
        <b>avec environ 5 % des besoins en chaleur du pays couverts</b> par les réseaux.
      </>
    ),
    seoDescription: 'Analyse des livraisons de chaleur en France et leur contribution au chauffage national.',
    seoTitle: 'Livraisons de chaleur par les réseaux en France ',
    title: 'Que représentent les livraisons de chaleur par les réseaux en France ?',
  },
  reseau: {
    content: <Network />,
    description: (
      <>
        Un réseau de chaleur est un{' '}
        <b>
          système de canalisations qui permettent d’acheminer vers un ensemble de bâtiments de la chaleur produite localement, à partir
          d’énergies renouvelables et de récupération.
        </b>
      </>
    ),
    seoDescription:
      'Un réseau de chaleur est un système de chauffage à l’échelle d’une ville ou d’un quartier, qui permet de mobiliser des énergies renouvelables locales.',
    title: 'Qu’est-ce qu’un réseau de chaleur ?',
  },
  role: {
    altTitle: 'Quel est le rôle du chauffage urbain dans la transition énergétique ?',
    content: <Role />,
    description: (
      <>
        Les bâtiments (résidentiels et tertiaires) sont responsables de près de la moitié des consommations d’énergie en France, et{' '}
        <b>de 15 % des émissions de gaz à effet de serre</b>, principalement dues au chauffage des bâtiments. Les réseaux de chaleur
        constituent un levier efficace pour réduire ces émissions.
      </>
    ),
    seoDescription:
      'Les réseaux de chaleur, un levier efficace pour accélérer la décarbonation du bâtiment et atteindre la neutralité carbone en 2050.',
    seoTitle: 'Rôle du chauffage urbain dans la transition énergétique',
    title: 'Un rôle clé dans la transition énergétique',
  },
};

export const understandings: Record<string, Document> = {
  aides: {
    altTitle: 'Quelles aides financières pour se raccorder ?',
    content: <Helps />,
    description: (
      <>
        Depuis le 1er septembre 2022, le coup de pouce <b>« Chauffage des bâtiments résidentiels collectifs et tertiaires »</b> permet de
        réduire significativement le coût du raccordement à un réseau de chaleur.
      </>
    ),
    seoDescription:
      'Le coup de pouce chauffage des bâtiments résidentiels collectifs et tertiaires : une aide conséquente pour réduire les coûts de raccordement.',
    seoTitle: 'Aides pour se raccorder à un réseau de chaleur - CEE',
    title:
      'Le coup de pouce chauffage des bâtiments résidentiels collectifs et tertiaires : une aide financière conséquente pour se raccorder',
  },
  avantages: {
    content: <Advantages />,
    description: (
      <>
        Se raccorder à un réseau de chaleur, c’est <b>64 %</b> de réduction des émissions de gaz à effet de serre par rapport à un chauffage
        au fioul et <b>51 %</b> par rapport à un chauffage au gaz. Et ce n'est pas le seul avantage !
      </>
    ),
    seoDescription:
      'Stabilisez le montant de votre facture de chauffage, réduisez vos émissions de gaz à effet de serre de 51 % (gaz) à 64 % (fioul).',
    seoTitle: 'Comparatif chauffage urbain vs. chaudière gaz ou fioul',
    title: 'Quels avantages par rapport à un chauffage collectif au gaz ou fioul ?',
  },
  'cout-raccordement': {
    content: <CoutRaccordement />,
    description: (
      <>
        Le raccordement d’un bâtiment à un réseau de chaleur présente un coût non négligeable. Toutefois, des aides permettent de le réduire
        fortement. De plus, l’investissement peut être rapidement amorti dès lors que le prix de la chaleur livrée par le réseau est
        compétitif.
      </>
    ),
    seoDescription: 'Le coût du raccordement peut être réduit grâce à des aides financières.',
    seoTitle: 'Aides financières pour réduire le coût du raccordement au chauffage urbain',
    title: 'Combien coûte un raccordement ?',
  },
  'dispositif-eco-energie-tertiaire': {
    content: <DispositifEcoEnergieTertiaire />,
    description:
      'Se raccorder à un réseau de chaleur, c’est 23 % de réduction de consommations d’énergie comptabilisée dans le cadre du dispositif Éco Énergie Tertiaire.',
    seoDescription:
      'Se raccorder à un réseau de chaleur, c’est 23 % de réduction de consommations d’énergie comptabilisée dans le cadre du dispositif Éco Énergie Tertiaire.',
    seoTitle: 'Valoriser un raccordement dans le cadre du dispositif Éco Énergie Tertiaire',
    title: 'Valoriser un raccordement dans le cadre du dispositif Éco Énergie Tertiaire',
  },
  facture: {
    content: <Bill />,
    description: (
      <>
        En raccordant mon immeuble à un réseau de chaleur, je bénéficie d’une <b>facture plus stable qu’avec un autre mode de chauffage.</b>
      </>
    ),
    seoDescription: 'Profitez d’une facture de chauffage plus stable en raccordant votre immeuble à un réseau de chaleur.',
    title: 'Comprendre la facture de chauffage de ma copropriété',
  },
  faisabilite: {
    content: <Feasability />,
    description: 'La faisabilité d’un raccordement dépend de certains critères techniques préalables.',
    seoDescription: 'Découvrez les critères techniques déterminant la faisabilité d’un raccordement au chauffage urbain.',
    seoTitle: 'Quels critères pour se raccorder à un réseau de chaleur ?',
    title: 'Qu’est-ce qui détermine la faisabilité du raccordement ?',
  },
  financement: {
    content: <Fundings />,
    description:
      'Lorsque le raccordement au réseau de chaleur s’intègre dans des travaux de rénovation globale, des aides complémentaires au "Coup de pouce chauffage des bâtiments résidentiels collectifs et tertiaires" sont mobilisables.',
    seoDescription:
      'Financer le raccordement d’une copropriété à un réseau de chaleur dans le cadre d’une rénovation globale : subventions disponibles.',
    seoTitle: 'Financer un raccordement au chauffage urbain (copropriété)',
    title: 'Financer le raccordement de sa copropriété dans le cadre d’une rénovation globale',
  },
  'obligations-raccordement': {
    content: <ObligationsRaccordement />,
    description:
      'Le raccordement est obligatoire sur certains réseaux, pour tout bâtiment neuf ou renouvelant son installation de chauffage au-dessus d’une certaine puissance.',
    seoDescription:
      'Le raccordement est obligatoire sur certains réseaux, pour tout bâtiment neuf ou renouvelant son installation de chauffage au-dessus d’une certaine puissance.',
    seoTitle: 'Mon bâtiment est-il concerné par une obligation de raccordement au réseau de chaleur ?',
    title: 'Mon bâtiment est-il concerné par une obligation de raccordement au réseau de chaleur ?',
  },
  'reseau-classe': {
    content: <ClassedNetwork />,
    description:
      'Le classement d’un réseau instaure une obligation de raccordement pour certains bâtiments, dans une zone autour du réseau qualifiée de périmètre de développement prioritaire.',
    seoDescription:
      'Le classement d’un réseau instaure une obligation de raccordement pour certains bâtiments, dans une zone autour du réseau qualifiée de périmètre de développement prioritaire.',
    seoTitle: 'Qu’est-ce qu’un réseau classé ?',
    title: 'Qu’est-ce qu’un réseau classé ?',
  },
};

export const growths: Record<string, Document> = {
  acteurs: {
    content: <Actors />,
    description: (
      <>
        Les réseaux de chaleur sont majoritairement établis à l’initiative de <b>collectivités territoriales</b>, mais leur gestion est le
        plus souvent concédée à des <b>opérateurs</b>, via des délégations de service public.
      </>
    ),
    seoDescription: 'Les réseaux de chaleur, un service public de distribution de la chaleur porté par les collectivités locales.',
    seoTitle: 'Quels sont les principaux acteurs des réseaux de chaleur ?',
    title: 'Quels sont les principaux acteurs de la filière ?',
  },
  etat: {
    altTitle: "Par quels dispositifs financiers l'État soutient-il les réseaux de chaleur ?",
    content: <State />,
    description: 'Plusieurs dispositifs financiers sont mis en place par l’État pour accompagner le développement des réseaux de chaleur.',
    seoDescription: 'L’État soutient le développement des réseaux de chaleur, notamment via le Fonds Chaleur opéré par l’ADEME.',
    title: 'L’État investit dans les réseaux de chaleur',
  },
};

export const coldNetworks: Record<string, Document> = {
  'reseau-de-froid': {
    content: <ColdNetwork />,
    description:
      'Un réseau de froid est constitué de canalisations souterraines qui permettent d’acheminer du froid vers un ensemble de bâtiments, avec une efficacité énergétique supérieure aux systèmes individuels ou collectifs centraux habituels. Les réseaux de froid sont majoritairement utilisés pour la climatisation des bâtiments tertiaires.',
    seoDescription:
      'Les réseaux de froid offrent une climatisation efficace, avec des rendements énergétiques élevés, principalement pour les bâtiments tertiaires.',
    title: 'Découvrir les réseaux de froid',
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
