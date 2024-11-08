import { fr } from '@codegouvfr/react-dsfr';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { PagesProgressBar as ProgressBar } from 'next-nprogress-bar';
import { SWRConfig, SWRConfiguration } from 'swr';

import { ConsentBanner } from '@components/ConsentBanner';
import '@components/Map/StyleSwitcher/styles.css';
import ThemeProvider, { augmentDocumentWithEmotionCache, dsfrDocumentApi } from '@components/Theme/ThemeProvider';
import { usePreserveScroll } from '@hooks/usePreserveScroll';
import { HeatNetworkService, ServicesContext, SuggestionService } from 'src/services';
import { AdminService } from 'src/services/admin';
import { useAnalytics } from 'src/services/analytics';
import { DemandsService } from 'src/services/demands';
import { ExportService } from 'src/services/export';
import { axiosHttpClient } from 'src/services/http';
import { NetworksService } from 'src/services/networks';
import { PasswordService } from 'src/services/password';

declare module '@codegouvfr/react-dsfr/next-pagesdir' {
  interface RegisterLink {
    Link: typeof Link;
  }
}

export { augmentDocumentWithEmotionCache, dsfrDocumentApi };

const og = {
  // TODO: USE https://www.screenshotmachine.com/website-screenshot-api.php
  imagePreview: `/img/preview/fcu-preview-20220517.min.jpg?date=${Date.now()}`,
  type: 'website',
  domaine: 'france-chaleur-urbaine.beta.gouv.fr',
  url: 'https://france-chaleur-urbaine.beta.gouv.fr/',
  title: 'Accélérons les raccordements aux réseaux de chaleur.',
  decretTertiaireDescription:
    'Raccorder son bâtiment au réseau de chaleur, c’est jusqu’à 23 % de réduction de consommations d’énergie comptabilisée ! En application de l’arrêté du 13 avril 2022 relatif aux obligations d’actions de réduction des consommations d’énergie finale dans des bâtiments à usage tertiaire, un coefficient de 0,77 est appliqué aux calculs des consommations d’énergie des bâtiments raccordés aux réseaux de chaleur.',
  description: 'Une solution de chauffage écologique et économique exploitant des énergies renouvelables et de récupération locales.',
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
    <ThemeProvider>
      <ConsentBanner />
      <ServicesContext.Provider
        value={{
          suggestionService: new SuggestionService(axiosHttpClient),
          heatNetworkService: new HeatNetworkService(axiosHttpClient),
          demandsService: new DemandsService(axiosHttpClient),
          passwordService: new PasswordService(axiosHttpClient),
          adminService: new AdminService(axiosHttpClient),
          networksService: new NetworksService(axiosHttpClient),
          exportService: new ExportService(axiosHttpClient),
        }}
      >
        <Head>
          {favicons.map((faviconProps: { rel: string; href: string; type?: string }, i: number) => (
            <link key={i} {...faviconProps} />
          ))}
          {/* <!-- HTML Meta Tags --> */}
          <title>Facilitez le raccordement à un chauffage économique et écologique</title>
          <meta name="description" content={router.pathname === '/decret-tertiaire' ? og.decretTertiaireDescription : og.description} />

          {/* <!-- Facebook Meta Tags --> */}
          <meta property="og:url" content={og.url} />
          <meta property="og:type" content={og.type} />
          <meta property="og:title" content={og.title} />
          <meta
            property="og:description"
            content={router.pathname === '/decret-tertiaire' ? og.decretTertiaireDescription : og.description}
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
            <ProgressBar height="4px" color={fr.colors.decisions.background.active.blueFrance.default} shallowRouting />
            <Component {...pageProps} />
          </SessionProvider>
        </SWRConfig>
      </ServicesContext.Provider>
    </ThemeProvider>
  );
}
export default App;
