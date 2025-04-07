import { fr } from '@codegouvfr/react-dsfr';
import { spacingTokenByValue } from '@codegouvfr/react-dsfr/fr/generatedFromCss/spacing';
import type { Config } from 'tailwindcss';

const replaceKeyDeep = <T>(obj: T, search: string, replacement: string): T => {
  if (typeof obj === 'object' && obj !== null) {
    Object.keys(obj).forEach((key) => {
      if (key === search) {
        obj[replacement] = obj[key];
        delete obj[key];
      } else {
        obj[key] = replaceKeyDeep(obj[key], search, replacement);
      }
    });
  }
  return obj;
};

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
      colors: {
        // Use colors from DSFR through md:text-redMarianne-_975_75-active https://www.systeme-de-design.gouv.fr/fondamentaux/couleurs-palette
        ...replaceKeyDeep<typeof fr.colors.options>(fr.colors.options, 'default', 'DEFAULT'),
        blue: fr.colors.decisions.background.flat.blueFrance.default,
        'blue-light': '#B2D6F2',
        red: fr.colors.decisions.background.flat.redMarianne.default,
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
        'fcu-green': '#009364',
        'fcu-blue': '#00B1F8',
        'fcu-purple': '#8585F6',
        'fcu-purple-dark': '#4550E5',
        'fcu-yellow': '#F9F21A',
        'fcu-orange': '#FF692F',
        'fcu-orange-light': '#F89389',
        light: fr.colors.decisions.background.alt.blueFrance.default,
        accent: fr.colors.options.blueFrance.main525,
        grey: 'var(--text-default-grey)',
      },
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
