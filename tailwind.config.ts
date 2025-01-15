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
      // Use colors from DSFR through md:text-redMarianne-_975_75-active https://www.systeme-de-design.gouv.fr/fondamentaux/couleurs-palette
      colors: replaceKeyDeep<typeof fr.color.options>(fr.colors.options, 'default', 'DEFAULT'),
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
