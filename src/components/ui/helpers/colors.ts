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

  grey: 'var(--text-default-grey)',
};

type DSFRColors = typeof fr.colors.options;

const colors = {
  // Use colors from DSFR through md:text-redMarianne-_975_75-active https://www.systeme-de-design.gouv.fr/fondamentaux/couleurs-palette
  ...replaceKeyDeep<DSFRColors>(fr.colors.options, 'default', 'DEFAULT'),

  ...palette,

  'info-light': fr.colors.decisions.background.contrast.info.default,
  info: fr.colors.decisions.text.default.info.default,

  'faded-light': fr.colors.decisions.background.contrast.grey.default,
  faded: fr.colors.decisions.text.default.grey.default,

  'success-light': fr.colors.decisions.background.contrast.success.default,
  success: fr.colors.decisions.text.default.success.default,

  error: fr.colors.decisions.text.default.error.default,
  'error-light': fr.colors.decisions.background.contrast.error.default,

  destructive: fr.colors.decisions.text.default.error.default,
  'destructive-light': fr.colors.decisions.background.contrast.error.default,

  warning: fr.colors.decisions.text.default.warning.default,
  'warning-light': fr.colors.decisions.background.contrast.warning.default,

  light: fr.colors.decisions.background.alt.blueFrance.default,

  accent: '#FF692F',

  primary: palette.blue,

  border: '#d1d5db',

  'fcu-green': '#009364',
  'fcu-blue': '#00B1F8',
  'fcu-purple': '#8585F6',
  'fcu-purple-dark': '#4550E5',
  'fcu-yellow': '#F9F21A',
  'fcu-orange': '#FF692F',
  'fcu-orange-light': '#F89389',
} as const;

export type Color = keyof typeof colors;

export default colors;

export const legacyColors = {
  lightblue: '#4550E5',
  purple: 'var(--blue-france-main-525)',
  darkblue: 'var(--blue-france-sun-113-625)',
  darkerblue: 'var(--legacy-darker-blue)',
  lightgrey: '#78818D',
  white: '#FFF',
  black: 'var(--grey-50-1000)',
} as const;

export type LegacyColor = keyof typeof legacyColors;
