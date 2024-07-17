import { createNextDsfrIntegrationApi } from '@codegouvfr/react-dsfr/next-pagesdir';
import '@reach/combobox/styles.css';
import { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { ConsentBanner } from '@components/ConsentBanner';
import { usePreserveScroll } from '@hooks/usePreserveScroll';
import { MuiDsfrThemeProvider } from 'src/MuiDsfrThemeProvider';
import 'src/components/Map/StyleSwitcher/styles.css';
import {
  HeatNetworkService,
  ServicesContext,
  SuggestionService,
} from 'src/services';
import { AdminService } from 'src/services/admin';
import { useAnalytics } from 'src/services/analytics';
import { DemandsService } from 'src/services/demands';
import { axiosHttpClient } from 'src/services/http';
import { PasswordService } from 'src/services/password';
import { createGlobalStyle } from 'styled-components';
import { SWRConfig, SWRConfiguration } from 'swr';
import { createEmotionSsrAdvancedApproach } from 'tss-react/next/pagesDir';

declare module '@codegouvfr/react-dsfr/next-pagesdir' {
  interface RegisterLink {
    Link: typeof Link;
  }
}

const { withDsfr, dsfrDocumentApi } = createNextDsfrIntegrationApi({
  defaultColorScheme: 'system',
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
const { withAppEmotionCache, augmentDocumentWithEmotionCache } =
  createEmotionSsrAdvancedApproach({
    key: 'css',
  });

export { augmentDocumentWithEmotionCache };

const og = {
  // TODO: USE https://www.screenshotmachine.com/website-screenshot-api.php
  imagePreview: `/img/preview/fcu-preview-20220517.min.jpg?date=${Date.now()}`,
  type: 'website',
  domaine: 'france-chaleur-urbaine.beta.gouv.fr',
  url: 'https://france-chaleur-urbaine.beta.gouv.fr/',
  title: 'Accélérons les raccordements aux réseaux de chaleur.',
  decretTertiaireDescription:
    'Raccorder son bâtiment au réseau de chaleur, c’est jusqu’à 23 % de réduction de consommations d’énergie comptabilisée ! En application de l’arrêté du 13 avril 2022 relatif aux obligations d’actions de réduction des consommations d’énergie finale dans des bâtiments à usage tertiaire, un coefficient de 0,77 est appliqué aux calculs des consommations d’énergie des bâtiments raccordés aux réseaux de chaleur.',
  description:
    'Une solution de chauffage écologique et économique exploitant des énergies renouvelables et de récupération locales.',
  twitterCard: 'summary_large_image',
};

const favicons = [
  {
    rel: 'apple-touch-icon',
    href: '/favicons/apple-touch-icon.png',
  },
  { rel: 'icon', href: '/favicons/favicon.svg', type: 'image/svg+xml' },
  {
    rel: 'shortcut icon',
    href: '/favicons/favicon.ico',
    type: 'image/x-icon',
  },
];

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

const swrConfig: SWRConfiguration = {
  revalidateOnFocus: false,
};

function App({
  Component,
  pageProps,
}: AppProps<{
  session: Session;
}>) {
  const router = useRouter();
  usePreserveScroll();
  useAnalytics();

  return (
    <MuiDsfrThemeProvider>
      <ConsentBanner />
      <AppGlobalStyle />
      <DsfrFixUp />
      <ServicesContext.Provider
        value={{
          suggestionService: new SuggestionService(axiosHttpClient),
          heatNetworkService: new HeatNetworkService(axiosHttpClient),
          demandsService: new DemandsService(axiosHttpClient),
          passwordService: new PasswordService(axiosHttpClient),
          adminService: new AdminService(axiosHttpClient),
        }}
      >
        <Head>
          {favicons.map(
            (
              faviconProps: { rel: string; href: string; type?: string },
              i: number
            ) => (
              <link key={i} {...faviconProps} />
            )
          )}
          {/* <!-- HTML Meta Tags --> */}
          <title>
            Facilitez le raccordement à un chauffage économique et écologique
          </title>
          <meta
            name="description"
            content={
              router.pathname === '/decret-tertiaire'
                ? og.decretTertiaireDescription
                : og.description
            }
          />

          {/* <!-- Facebook Meta Tags --> */}
          <meta property="og:url" content={og.url} />
          <meta property="og:type" content={og.type} />
          <meta property="og:title" content={og.title} />
          <meta
            property="og:description"
            content={
              router.pathname === '/decret-tertiaire'
                ? og.decretTertiaireDescription
                : og.description
            }
          />
          <meta property="og:image" content={og.imagePreview} />

          {/* <!-- Twitter Meta Tags --> */}
          <meta name="twitter:card" content={og.twitterCard} />
          <meta property="twitter:domain" content={og.domaine} />
          <meta property="twitter:url" content={og.url} />
          <meta name="twitter:title" content={og.title} />
          <meta name="twitter:description" content={og.description} />
          <meta name="twitter:image" content={og.imagePreview} />

          {/* <!-- Meta Tags Generated via https://www.opengraph.xyz --> */}
        </Head>

        <SWRConfig value={swrConfig}>
          <SessionProvider session={pageProps.session}>
            <Component {...pageProps} />
          </SessionProvider>
        </SWRConfig>
      </ServicesContext.Provider>
    </MuiDsfrThemeProvider>
  );
}
export default withDsfr(withAppEmotionCache(App));
