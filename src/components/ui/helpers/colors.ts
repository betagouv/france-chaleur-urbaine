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
