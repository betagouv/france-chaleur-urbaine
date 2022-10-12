import { ReactNode } from 'react';
import GreenEnergies from './Contents/GreenEnergies';
import Network from './Contents/Network';

export type Document = {
  title: string;
  description: ReactNode;
  content: ReactNode;
};

export const issues: Record<string, Document> = {
  reseau: {
    title: 'Qu’est-ce qu’un réseau de chaleur ?',
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
};

export const understandings: Record<string, Document> = {
  faisabilite: {
    title: 'Qu’est-ce qui détermine la faisabilité du raccordement ?',
    description:
      'La faisabilité d’un raccordement dépend de certains critères techniques préalables.',
    content: <Network />,
  },
  faisabilite1: {
    title: 'Qu’est-ce qui détermine la faisabilité du raccordement ?',
    description:
      'La faisabilité d’un raccordement dépend de certains critères techniques préalables.',
    content: <Network />,
  },
  faisabilite2: {
    title: 'Qu’est-ce qui détermine la faisabilité du raccordement ?',
    description:
      'La faisabilité d’un raccordement dépend de certains critères techniques préalables.',
    content: <Network />,
  },
  faisabilite3: {
    title: 'Qu’est-ce qui détermine la faisabilité du raccordement ?',
    description:
      'La faisabilité d’un raccordement dépend de certains critères techniques préalables.',
    content: <Network />,
  },
};

export const growths: Record<string, Document> = {
  acteurs: {
    title: 'Quels sont les principaux acteurs de la filière ?',
    description:
      'La faisabilité d’un raccordement dépend de certains critères techniques préalables.',
    content: <Network />,
  },
};
