import { fetchHttpClient } from '@components/lib';
import '@gouvfr/dsfr/dist/css/dsfr.min.css';
import '@reach/combobox/styles.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import React from 'react';
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
@media (min-width: 992px) {
  .fr-header {
    transition: margin-top .25s ease;

    .fr-nav__Logo-Entry {
      width: 0;
    }
    .fr-nav__logo {
      width: 100%;
      height: auto;
      max-height: 100%;
      opacity: 0;
      transition: width .25s ease;
    }

    &.fullscreen {
      margin-top: -10rem;

      .fr-nav__Logo-Entry {
        width: 4.4rem;
      }
      .fr-nav__logo {
        opacity: 1;
      }
    }
  }

  .fr-footer {
    padding-top: 0;

    .fr-container {
        position: relative;
    }
    .fr-footer__body {
        padding-bottom: 1.5rem;
        margin-top: 2.5rem;
        margin-bottom: 0;
        border-bottom: 1px solid var(--g400);
    }
    .fr-footer__bottom {
        border-top: 0 none;
        margin-top: 0;
    }

    &.fullscreen {
      .fr-footer__body {
        display: none;
    }

    }
  }
}

`;

function MyApp({ Component, pageProps }: AppProps) {
  React.useEffect(() => {
    import('@gouvfr/dsfr/dist/js/dsfr.module.min.js');
  }, []);
  return (
    <>
      <DsfrFixUp />
      <GlobalStyle />
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
        </Head>
        <Component {...pageProps} />
      </ServicesContext.Provider>
    </>
  );
}
export default MyApp;
