import { createNextDsfrIntegrationApi } from '@codegouvfr/react-dsfr/next-pagesdir';
import '@reach/combobox/styles.css';
import isPropValid from '@emotion/is-prop-valid';
import { useLocalStorageValue } from '@react-hookz/web';
import Link from 'next/link';
import React from 'react';
import { createGlobalStyle, StyleSheetManager, ThemeProvider as StyledComponentsThemeProvider } from 'styled-components';

import theme from './theme';

declare module '@codegouvfr/react-dsfr/next-pagesdir' {
  interface RegisterLink {
    Link: typeof Link;
  }
}

declare module 'styled-components' {
  export interface DefaultTheme {
    media: typeof theme.media;
    breakpoints: typeof theme.breakpoints;
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
  .items-start {
   align-items: start !important;
  }
  .btn-full-width {
    width: 100%;
    justify-content: center;
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

const DsfrFixUp: any = createGlobalStyle` /* TODO: Wait Fix from @types/styled-component : https://github.com/styled-components/styled-components/issues/3738 */
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

  .fr-btn[target=_blank]:after {
    content: "\\ecaf" !important;
  }

  .fr-gap--xs {
    gap: 2px;
  }
  .fr-gap--sm {
    gap: 4px;
  }
  .fr-gap--md {
    gap: 8px;
  }
  .fr-gap--lg {
    gap: 16px;

  /* Animations */
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
  @keyframes slide-in-left {
    0% {
      transform: translateX(-1000px);
      opacity: 0;
    }
    100% {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
// https://styled-components.com/docs/faqs#shouldforwardprop-is-no-longer-provided-by-default
// This is to keep the same behavior as in styled-components v4
// TODO all props in styled-components should be modified to transient ones (with $)
function shouldForwardProp(propName: string, target: any): boolean {
  if (typeof target === 'string') {
    // For HTML elements, forward the prop if it is a valid HTML attribute
    return isPropValid(propName);
  }
  // For other elements, forward all props
  return true;
}

const useLightTheme = () => {
  // React DSFR is forcing by default scheme in local storage
  // When support for dark mode was removed, those who already had this preference are still in dark mode
  // This resets it
  const { value: currentTheme, set } = useLocalStorageValue<'light' | 'dark'>('scheme', {
    parse: (value) => value as 'light' | 'dark',
    stringify: (value) => value,
  });
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
      <StyleSheetManager shouldForwardProp={shouldForwardProp} enableVendorPrefixes>
        <>
          <AppGlobalStyle />
          <DsfrFixUp />
          {children}
        </>
      </StyleSheetManager>
    </StyledComponentsThemeProvider>
  );
}
export default withDsfr(ThemeProvider);
