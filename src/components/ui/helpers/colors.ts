import { fr } from '@codegouvfr/react-dsfr';

type DeepRecord = {
  [key: string]: string | DeepRecord;
};

const replaceKeyDeep = <T extends DeepRecord>(obj: T, search: string, replacement: string): T => {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const entries = Object.entries(obj).map(([key, value]) => {
    if (key === search) {
      return [replacement, value];
    }
    if (typeof value === 'object' && value !== null) {
      return [key, replaceKeyDeep(value as DeepRecord, search, replacement)];
    }
    return [key, value];
  });

  return Object.fromEntries(entries) as T;
};

export const palette = {
  blue: fr.colors.decisions.background.active.blueFrance.default,
  'blue-50': '#e6e6f4',
  'blue-200': '#9999d3',
  'blue-400': '#3333a7',
  'blue-600': '#000074',
  'blue-800': '#00003a',
  'blue-dark': '#000057',
  'blue-darker': '#00001d',
  'blue-light': '#6666bd',
  'blue-lighter': '#cccce9',

  grey: 'var(--text-default-grey)',
  red: fr.colors.decisions.background.active.redMarianne.default,

  'red-50': '#fae8e9',
  'red-200': '#e9a3a5',
  'red-400': '#d4474b',
  'red-600': '#a11418',
  'red-800': '#500a0c',
  'red-dark': '#790f12',
  'red-darker': '#280506',
  'red-light': '#df7578',
  'red-lighter': '#f4d1d2',
};

type DSFRColors = typeof fr.colors.options;

const colors = {
  // Use colors from DSFR through md:text-redMarianne-_975_75-active https://www.systeme-de-design.gouv.fr/fondamentaux/couleurs-palette
  ...replaceKeyDeep<DSFRColors>(fr.colors.options, 'default', 'DEFAULT'),

  ...palette,

  accent: '#6060ff',

  border: '#d1d5db',

  destructive: fr.colors.decisions.text.default.error.default,
  'destructive-light': fr.colors.decisions.background.contrast.error.default,

  error: fr.colors.decisions.text.default.error.default,
  'error-light': fr.colors.decisions.background.contrast.error.default,
  faded: fr.colors.decisions.text.default.grey.default,

  'faded-light': fr.colors.decisions.background.contrast.grey.default,
  'fcu-blue': '#00B1F8',

  'fcu-green': '#009364',
  'fcu-green-light': '#81b39b',
  'fcu-orange': '#FF692F',
  'fcu-orange-light': '#F89389',
  'fcu-purple': '#8585F6',
  'fcu-purple-dark': '#6060ff',
  'fcu-yellow': '#F9F21A',
  info: fr.colors.decisions.text.default.info.default,

  'info-light': fr.colors.decisions.background.contrast.info.default,

  input: '#EEE', // fr.colors.options.grey._950_100.default,
  'input-border': '#3A3A3A', // fr.colors.decisions.border.plain.grey,

  light: fr.colors.decisions.background.alt.blueFrance.default,

  primary: palette.blue,

  stripe: '#F6F6F6',
  success: fr.colors.decisions.text.default.success.default,

  'success-light': fr.colors.decisions.background.contrast.success.default,

  warning: fr.colors.decisions.text.default.warning.default,
  'warning-light': fr.colors.decisions.background.contrast.warning.default,
} as const;

export type Color = keyof typeof colors;

export default colors;

export const legacyColors = {
  black: 'var(--grey-50-1000)',
  darkblue: 'var(--blue-france-sun-113-625)',
  darkerblue: 'var(--legacy-darker-blue)',
  lightblue: '#6060ff',
  lightgrey: '#78818D',
  purple: 'var(--blue-france-main-525)',
  white: '#FFF',
} as const;

export type LegacyColor = keyof typeof legacyColors;
