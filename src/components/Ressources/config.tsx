import { ReactNode } from 'react';
import Actors from './Contents/Actors';
import GreenEnergies from './Contents/GreenEnergies';
import Livraisons from './Contents/Livraisons';
import Network from './Contents/Network';
import Role from './Contents/Role';
import State from './Contents/State';
import Strengths from './Contents/Strengths';

export type Document = {
  title: string;
  description: ReactNode;
  content: ReactNode;
};

export const issues: Record<string, Document> = {
  reseau: {
    title: 'Qu’est-ce qu’un réseau de chaleur ?',
    description: (
      <>
        Un réseau de chaleur est un{' '}
        <b>
          système de canalisations qui permettent d’acheminer vers un ensemble
          de bâtiments de la chaleur produite localement, à partir d’énergies
          renouvelables et de récupération.
        </b>
      </>
    ),
    content: <Network />,
  },
  'energie-vertes': {
    title: 'Les réseaux de chaleur : des énergies vertes',
    description: (
      <>
        Les réseaux de chaleur français sont alimentés en moyenne à{' '}
        <b>60 % par des énergies renouvelables et de récupération locales.</b>
      </>
    ),
    content: <GreenEnergies />,
  },
  atouts: {
    title: 'Un mode de chauffage aux multiples atouts',
    description: (
      <>
        Se chauffer par un réseau de chaleur, c’est adopter un{' '}
        <b>mode de chauffage fiable</b> qui présente des bénéfices à la fois
        environnementaux, sanitaires, économiques et sociaux...
      </>
    ),
    content: <Strengths />,
  },
  livraisons: {
    title:
      'Que représentent les livraisons de chaleur par les réseaux en France ?',
    description: (
      <>
        Au niveau européen, la France ne se place qu’en 20ème position en termes
        de recours aux réseaux de chaleur,{' '}
        <b>avec environ 5 % des besoins en chaleur du pays couverts</b> par les
        réseaux.
      </>
    ),
    content: <Livraisons />,
  },
  role: {
    title: 'Un rôle clé dans la transition énergétique',
    description: (
      <>
        Les bâtiments (résidentiels et tertiaires) sont responsables de près de
        la moitié des consommations d’énergie en France, et{' '}
        <b>de 15 % des émissions de gaz à effet de serre</b>, principalement
        dues au chauffage des bâtiments. Les réseaux de chaleur constituent un
        levier efficace pour réduire ces émissions.
      </>
    ),
    content: <Role />,
  },
};

export const understandings: Record<string, Document> = {
  faisabilite: {
    title: 'Qu’est-ce qui détermine la faisabilité du raccordement ?',
    description:
      'La faisabilité d’un raccordement dépend de certains critères techniques préalables.',
    content: <Network />,
  },
  faisabilite1: {
    title: 'Qu’est-ce qui détermine la faisabilité du raccordement ?',
    description:
      'La faisabilité d’un raccordement dépend de certains critères techniques préalables.',
    content: <Network />,
  },
  faisabilite2: {
    title: 'Qu’est-ce qui détermine la faisabilité du raccordement ?',
    description:
      'La faisabilité d’un raccordement dépend de certains critères techniques préalables.',
    content: <Network />,
  },
  faisabilite3: {
    title: 'Qu’est-ce qui détermine la faisabilité du raccordement ?',
    description:
      'La faisabilité d’un raccordement dépend de certains critères techniques préalables.',
    content: <Network />,
  },
};

export const growths: Record<string, Document> = {
  acteurs: {
    title: 'Quels sont les principaux acteurs de la filière ?',
    description: '',
    content: <Actors />,
  },
  etat: {
    title: 'L’État investit dans les réseaux de chaleur',
    description:
      'Plusieurs dispositifs financiers sont mis en place par État pour accompagner le développement des réseaux de chaleur.',
    content: <State />,
  },
};
