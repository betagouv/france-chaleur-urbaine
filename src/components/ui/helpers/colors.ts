import { fr } from '@codegouvfr/react-dsfr';

export const legacyColors = {
  lightblue: '#4550E5',
  purple: 'var(--blue-france-main-525)',
  darkblue: 'var(--blue-france-sun-113-625)',
  darkerblue: 'var(--legacy-darker-blue)',
  lightgrey: '#78818D',
  white: '#FFF',
  black: 'var(--grey-50-1000)',
} as const;

export const palette = {
  'blue-50': '#e6e6f4',
  'blue-lighter': '#cccce9',
  'blue-200': '#9999d3',
  'blue-light': '#6666bd',
  'blue-400': '#3333a7',
  blue: fr.colors.decisions.background.active.blueFrance.default,
  'blue-600': '#000074',
  'blue-dark': '#000057',
  'blue-800': '#00003a',
  'blue-darker': '#00001d',

  'red-50': '#fae8e9',
  'red-lighter': '#f4d1d2',
  'red-200': '#e9a3a5',
  'red-light': '#df7578',
  'red-400': '#d4474b',
  red: fr.colors.decisions.background.active.redMarianne.default,
  'red-600': '#a11418',
  'red-dark': '#790f12',
  'red-800': '#500a0c',
  'red-darker': '#280506',
};

export const colors = {
  ...palette,

  primary: palette.blue,
};

export type LegacyColor = keyof typeof legacyColors;
