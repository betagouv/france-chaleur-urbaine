import { spacingTokenByValue } from '@codegouvfr/react-dsfr/fr/generatedFromCss/spacing';
import type { Config } from 'tailwindcss';

import colors from './src/components/ui/helpers/colors';

const config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      // Use breakpoints from DSFR https://www.systeme-de-design.gouv.fr/fondamentaux/grille-et-points-de-rupture
      screens: {
        xs: '320px',
        sm: '576px',
        md: '768px',
        lg: '992px',
        xl: '1200px',
      },
      // Use spacing from DSFR through md:my-10w https://www.systeme-de-design.gouv.fr/fondamentaux/couleurs-palette
      spacing: spacingTokenByValue,
      colors,
      keyframes: {
        puff: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.1)', opacity: '0.8' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        puff: 'puff 0.2s ease-in-out',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    function ({ addUtilities }) {
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
    },
  ],
} satisfies Config;

export default config;
