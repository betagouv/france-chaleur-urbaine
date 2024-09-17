import { createNextDsfrIntegrationApi } from '@codegouvfr/react-dsfr/next-pagesdir';
import '@reach/combobox/styles.css';
import { useLocalStorageValue } from '@react-hookz/web';
import Link from 'next/link';
import React from 'react';
import { createGlobalStyle, ThemeProvider as StyledComponentsThemeProvider } from 'styled-components';
import { createEmotionSsrAdvancedApproach } from 'tss-react/next/pagesDir';

import { MuiDsfrThemeProvider } from './MuiDsfrThemeProvider';
import theme from './theme';

import './theme.d';

declare module '@codegouvfr/react-dsfr/next-pagesdir' {
  interface RegisterLink {
    Link: typeof Link;
  }
}

const { withDsfr, dsfrDocumentApi } = createNextDsfrIntegrationApi({
  defaultColorScheme: 'light',
  doPersistDarkModePreferenceWithCookie: false,
  Link,
  preloadFonts: [
    //"Marianne-Light",
    //"Marianne-Light_Italic",
    'Marianne-Regular',
    //"Marianne-Regular_Italic",
    'Marianne-Medium',
    //"Marianne-Medium_Italic",
    'Marianne-Bold',
    //"Marianne-Bold_Italic",
    //"Spectral-Regular",
    //"Spectral-ExtraBold"
  ],
});

export { dsfrDocumentApi };

// https://github.com/codegouvfr/react-dsfr/issues/281#issuecomment-2231266401
const { withAppEmotionCache, augmentDocumentWithEmotionCache } = createEmotionSsrAdvancedApproach({
  key: 'css',
});

export { augmentDocumentWithEmotionCache };

export const AppGlobalStyle = createGlobalStyle`
  html {
    scroll-behavior: smooth;
  }
  .img-object-contain {
    object-fit: contain;
  }
  .img-object-cover {
    object-fit: cover;
  }
  .d-block {
    display: block !important;
  }
  .d-inline-block {
    display: inline-block !important;
  }
  .d-flex {
    display: flex !important;
  }
  // custom: not DSFR
  .fr-text--lightbold {
    font-weight: 500 !important;
  }
  :root {
    --white: #fff;
    --legacy-darker-blue: #000074;
    --background-light: #f9f8f6;

  }
  :root[data-fr-theme='dark'] {
    --legacy-darker-blue: #ccd2fc;
    --background-light: #060504;
  }
`;

const DsfrFixUp: any = createGlobalStyle` // TODO: Wait Fix from @types/styled-component : https://github.com/styled-components/styled-components/issues/3738
  input[type="checkbox"], input[type="radio"] {
    width: 13px;
    height: 13px;
  }

  input[type="checkbox"] {
    appearance: checkbox;
  }

  input[type="radio"] {
    appearance: radio;
  }

  .fr-header__service-title{
    color: #069368;
  }

  .fr-footer {
    margin-top: 2px;
  }

  .fr-footer__partners-logos {
    a[target=_blank] {
      &::after {
        display: none;
      }
    }
  }

  .fr-footer__logo {
    max-height: 60px !important;
    height: 60px !important;

    @media (min-width: 400px) {
      max-height: 80px !important;
      height: 80px !important;
    }
  }

  .fr-btn--secondary {
    background-color: var(--background-default-grey) !important;
    :hover {
      background-color: var(--hover-tint) !important;
    }
  }

  .fr-btn[target=_blank]:after {
    content: "\\ecaf" !important;
  }
`;

const useLightTheme = () => {
  // React DSFR is forcing by default scheme in local storage
  // When support for dark mode was removed, those who already had this preference are still in dark mode
  // This resets it
  const { value: currentTheme, set } = useLocalStorageValue<'light' | 'dark'>('scheme');
  React.useEffect(() => {
    if (currentTheme !== 'light') {
      set('light');
    }
  }, [set, currentTheme]);
};

function ThemeProvider({ children }: { children: React.ReactNode }) {
  useLightTheme();

  return (
    <StyledComponentsThemeProvider theme={theme}>
      <MuiDsfrThemeProvider>
        <AppGlobalStyle />
        <DsfrFixUp />
        {children}
      </MuiDsfrThemeProvider>
    </StyledComponentsThemeProvider>
  );
}
export default withDsfr(withAppEmotionCache(ThemeProvider));
