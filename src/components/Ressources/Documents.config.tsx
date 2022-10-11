import { ReactNode } from 'react';
import Network from './Contents/Network';

export type Document = {
  title: string;
  description: ReactNode;
  content: ReactNode;
};

export const enjeux: Record<string, Document> = {
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
};

export const comprendre = [];

export const documentsData = Object.entries(enjeux).concat(
  Object.entries(enjeux).map(([key, document]) => [`${key}-2`, document])
);
