import { fetchHttpClient } from '@components/lib';
import { LayoutProvider, MainLayout } from '@components/shared/layout';
import '@gouvfr/dsfr/dist/utility/icons/icons-system/icons-system.min.css';
import '@reach/combobox/styles.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import {
  HeatNetworkService,
  ServicesContext,
  SuggestionService,
} from 'src/services';
import { createGlobalStyle } from 'styled-components';

const og = {
  // TODO: USE https://www.screenshotmachine.com/website-screenshot-api.php
  imagePreview: `/img/preview/fcu-preview-20220517.min.jpg?date=${Date.now()}`,
  type: 'website',
  domaine: 'france-chaleur-urbaine.beta.gouv.fr',
  url: 'https://france-chaleur-urbaine.beta.gouv.fr/',
  title: 'Accélérons les raccordements aux réseaux de chaleur.',
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

const GlobalStyle = createGlobalStyle`
  html {
    scroll-behavior: smooth;
  }
`;
const DsfrFixUp = createGlobalStyle`
  .fr-footer {
    margin-top: 2px;
  }

  .fr-btn--secondary {
    background-color: white !important;
  }
`;

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <GlobalStyle />
      <DsfrFixUp />
      <ServicesContext.Provider
        value={{
          suggestionService: new SuggestionService(fetchHttpClient),
          heatNetworkService: new HeatNetworkService(fetchHttpClient),
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
          <meta name="description" content={og.description} />

          {/* <!-- Facebook Meta Tags --> */}
          <meta property="og:url" content={og.url} />
          <meta property="og:type" content={og.type} />
          <meta property="og:title" content={og.title} />
          <meta property="og:description" content={og.description} />
          <meta property="og:image" content={og.imagePreview} />

          {/* <!-- Twitter Meta Tags --> */}
          <meta name="twitter:card" content={og.twitterCard} />
          <meta property="twitter:domain" content={og.domaine} />
          <meta property="twitter:url" content={og.url} />
          <meta name="twitter:title" content={og.title} />
          <meta name="twitter:description" content={og.description} />
          <meta name="twitter:image" content={og.imagePreview} />

          {/* <!-- Meta Tags Generated via https://www.opengraph.xyz --> */}
          <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/npm/remixicon@2.5.0/fonts/remixicon.css"
          />
        </Head>

        <LayoutProvider>
          <MainLayout>
            <Component {...pageProps} />
          </MainLayout>
        </LayoutProvider>
      </ServicesContext.Provider>
    </>
  );
}
export default MyApp;
