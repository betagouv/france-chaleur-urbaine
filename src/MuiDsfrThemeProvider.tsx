'use client';
import { createMuiDsfrThemeProvider } from '@codegouvfr/react-dsfr/mui';

declare module '@mui/material/styles' {
  interface Theme {
    custom: {
      isDarkModeEnabled: boolean;
    };
  }
}

export const { MuiDsfrThemeProvider } = createMuiDsfrThemeProvider({
  augmentMuiTheme: ({ nonAugmentedMuiTheme }) => ({
    ...nonAugmentedMuiTheme,
    custom: {
      isDarkModeEnabled: true,
    },
  }),
});
