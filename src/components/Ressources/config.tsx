import { ReactNode } from 'react';
import Actors from './Contents/Actors';
import Advantages from './Contents/Advantages';
import Bill from './Contents/Bill';
import Feasability from './Contents/Feasability';
import GreenEnergies from './Contents/GreenEnergies';
import Helps from './Contents/Helps';
import Livraisons from './Contents/Livraisons';
import Network from './Contents/Network';
import Priority from './Contents/Priority';
import Role from './Contents/Role';
import State from './Contents/State';
import Strengths from './Contents/Strengths';

export type Document = {
  title: string;
  description: ReactNode;
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
          système de canalisations qui permettent d’acheminer vers un ensemble
          de bâtiments de la chaleur produite localement, à partir d’énergies
          renouvelables et de récupération.
        </b>
      </>
    ),
    content: <Network />,
  },
  'energies-verte': {
    title: 'Les réseaux de chaleur : des énergies vertes',
    description: (
      <>
        Les réseaux de chaleur français sont alimentés en moyenne à{' '}
        <b>62 % par des énergies renouvelables et de récupération locales.</b>
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
    content: <Feasability />,
  },
  avantages: {
    title:
      'Quels avantages par rapport à un chauffage collectif au gaz ou fioul ?',
    description: (
      <>
        Se raccorder à un réseau de chaleur, c’est <b>64 %</b> de réduction des
        émissions de gaz à effet de serre par rapport à un chauffage au fioul et{' '}
        <b>51 %</b> par rapport à un chauffage au gaz. Et ce n'est pas le seul
        avantage !
      </>
    ),
    content: <Advantages />,
  },
  aides: {
    title: 'Des aides financières conséquentes pour se raccorder',
    description: (
      <>
        Depuis le 1er septembre 2022, le coup de pouce{' '}
        <b>"Chauffage des bâtiments résidentiels collectifs et tertiaires ”</b>{' '}
        permet d’obtenir des aides financières conséquentes pour se raccorder.
      </>
    ),
    content: <Helps />,
  },
  facture: {
    title: 'Comprendre la facture de chauffage de ma copropriété',
    description: (
      <>
        En raccordant mon immeuble à un réseau de chaleur, je bénéficie d’une{' '}
        <b>facture plus stable qu’avec un autre mode de chauffage.</b>
      </>
    ),
    content: <Bill />,
  },
  prioritaire: {
    title:
      'Mon bâtiment est situé dans le périmètre de développement prioritaire',
    description: (
      <>
        Quels bâtiments sont concernés par <b>l’obligation de raccordement ?</b>
      </>
    ),
    content: <Priority />,
  },
};

export const growths: Record<string, Document> = {
  acteurs: {
    title: 'Quels sont les principaux acteurs de la filière ?',
    description: (
      <>
        Les réseaux de chaleur sont majoritairement établis à l’initiative de{' '}
        <b>collectivités territoriales</b>, mais leur gestion est le plus
        souvent concédée à des <b>opérateurs</b>, via des délégations de service
        public.
      </>
    ),
    content: <Actors />,
  },
  etat: {
    title: 'L’État investit dans les réseaux de chaleur',
    description:
      'Plusieurs dispositifs financiers sont mis en place par État pour accompagner le développement des réseaux de chaleur.',
    content: <State />,
  },
};
