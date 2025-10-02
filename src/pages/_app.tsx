import '@/styles/globals.css';
import { fr } from '@codegouvfr/react-dsfr';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import type Link from 'next/link';
// use AppProgressBar instead of PagesProgressBar on purpose as it handles better the query params ignoring
import { SessionProvider } from 'next-auth/react';
import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';
import { NuqsAdapter } from 'nuqs/adapters/next/pages';
import { useState } from 'react';

import '@/components/Map/StyleSwitcher/styles.css';
import SEO from '@/components/SEO';
import ThemeProvider, { dsfrDocumentApi } from '@/components/Theme/ThemeProvider';
import useHtmlAttributes from '@/hooks/useHtmlAttributes';
import { usePreserveScroll } from '@/hooks/usePreserveScroll';
import { useAnalytics } from '@/modules/analytics/client';
import { useInitAuthentication } from '@/modules/auth/client/hooks';
import { NotifierContainer } from '@/modules/notification';
import trpc from '@/modules/trpc/client';
import type { AuthSSRPageProps } from '@/server/authentication';
import { HeatNetworkService, ServicesContext, SuggestionService } from '@/services';
import { DemandsService } from '@/services/demands';
import { ExportService } from '@/services/export';
import { axiosHttpClient } from '@/services/http';
import { NetworksService } from '@/services/networks';
import { PasswordService } from '@/services/password';

const ConsentBanner = dynamic(
  () => import('@/components/ConsentBanner').then((module) => module.ConsentBanner),
  { ssr: false } // Disable server side as it injects server side a hidden modal with a H1 which might affect SEO
);

declare module '@codegouvfr/react-dsfr/next-pagesdir' {
  interface RegisterLink {
    Link: typeof Link;
  }
}

export { dsfrDocumentApi };

const AppInner = ({ Component, pageProps }: AppProps<AuthSSRPageProps>) => {
  // internally calls useQueryState from nuqs, so it needs to be called inside an underlying component
  useInitAuthentication(pageProps.session);
  return (
    <ThemeProvider>
      <SEO />
      <ConsentBanner />
      <NotifierContainer />
      <ProgressBar height="4px" color={fr.colors.decisions.background.active.blueFrance.default} />
      <Component {...pageProps} />
    </ThemeProvider>
  );
};

const AppProvider = (props: AppProps<AuthSSRPageProps>) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnReconnect: false,
            refetchOnWindowFocus: false, // see https://react-query.tanstack.com/guides/important-defaults
            retry: 1, // retry failing requests just once, see https://react-query.tanstack.com/guides/query-retries
            retryDelay: 3000, // retry failing requests after 3 seconds
          },
        },
      })
  );

  const [services] = useState(() => ({
    demandsService: new DemandsService(axiosHttpClient),
    exportService: new ExportService(axiosHttpClient),
    heatNetworkService: new HeatNetworkService(axiosHttpClient),
    networksService: new NetworksService(axiosHttpClient),
    passwordService: new PasswordService(axiosHttpClient),
    suggestionService: new SuggestionService(axiosHttpClient),
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        <ServicesContext.Provider value={services}>
          <AppInner {...props} />
        </ServicesContext.Provider>
      </NuqsAdapter>
    </QueryClientProvider>
  );
};

function App(appProps: AppProps<AuthSSRPageProps>) {
  usePreserveScroll();
  useAnalytics();
  useHtmlAttributes();

  return (
    <SessionProvider session={appProps.pageProps.session}>
      <AppProvider {...appProps} />
    </SessionProvider>
  );
}
export default trpc.withTRPC(App);
