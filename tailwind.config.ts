import { spacingTokenByValue } from '@codegouvfr/react-dsfr/fr/generatedFromCss/spacing';
import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

// Import colors through .mjs wrapper to work around Turbopack module resolution
// See tailwind.colors.mjs for details
import colors from './tailwind.colors.mjs';

const config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  important: true, // surcharge toujours le DSFR qui n'utilise pas les layers
  plugins: [
    animate,
    ({ addUtilities }) => {
      // Make spacing from DSFR available with hover and md: https://www.systeme-de-design.gouv.fr/fondamentaux/espacement
      Object.entries(spacingTokenByValue).forEach(([token, value]) => {
        const utilities = {
          [`.fr-p-${token}`]: { padding: value },
          [`.fr-m-${token}`]: { margin: value },
          [`.fr-mt-${token}`]: { marginTop: value },
          [`.fr-mr-${token}`]: { marginRight: value },
          [`.fr-mb-${token}`]: { marginBottom: value },
          [`.fr-ml-${token}`]: { marginLeft: value },
        };
        addUtilities(utilities, ['responsive', 'hover']);
      });

      // Add flex ratio utilities from 2 to 12
      const flexRatios = Object.fromEntries(
        Array.from({ length: 11 }, (_, i) => i + 2).map((ratio) => [`.flex-${ratio}`, { flex: `${ratio} 0 0%` }])
      );

      addUtilities(flexRatios, ['responsive']);
    },
  ],
  theme: {
    extend: {
      animation: {
        puff: 'puff 0.2s ease-in-out',
      },
      colors,
      keyframes: {
        puff: {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.1)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      // Use breakpoints from DSFR https://www.systeme-de-design.gouv.fr/fondamentaux/grille-et-points-de-rupture
      screens: {
        lg: '992px',
        md: '768px',
        sm: '576px',
        xl: '1200px',
        xs: '320px',
      },
      // Use spacing from DSFR through md:my-10w https://www.systeme-de-design.gouv.fr/fondamentaux/couleurs-palette
      spacing: spacingTokenByValue,
    },
  },
} satisfies Config;

export default config;
