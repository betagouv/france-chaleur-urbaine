import '@/styles/globals.css';
import { fr } from '@codegouvfr/react-dsfr';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import type Link from 'next/link';
// use AppProgressBar instead of PagesProgressBar on purpose as it handles better the query params ignoring
import { SessionProvider } from 'next-auth/react';
import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';
import { useState } from 'react';

import '@/components/Map/StyleSwitcher/styles.css';
import SEO from '@/components/SEO';
import ThemeProvider, { dsfrDocumentApi } from '@/components/Theme/ThemeProvider';
import useHtmlAttributes from '@/hooks/useHtmlAttributes';
import { usePreserveScroll } from '@/hooks/usePreserveScroll';
import { type AuthSSRPageProps } from '@/server/authentication';
import { HeatNetworkService, ServicesContext, SuggestionService } from '@/services';
import { AdminService } from '@/services/admin';
import { useAnalytics } from '@/services/analytics';
import { useInitAuthentication } from '@/services/authentication';
import { DemandsService } from '@/services/demands';
import { ExportService } from '@/services/export';
import { axiosHttpClient } from '@/services/http';
import { NetworksService } from '@/services/networks';
import { NotifierContainer } from '@/services/notification';
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

const AppProvider = ({ Component, pageProps }: AppProps<AuthSSRPageProps>) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1, // retry failing requests just once, see https://react-query.tanstack.com/guides/query-retries
            retryDelay: 3000, // retry failing requests after 3 seconds
            refetchOnWindowFocus: false, // see https://react-query.tanstack.com/guides/important-defaults
            refetchOnReconnect: false,
          },
        },
      })
  );
  useInitAuthentication(pageProps.session);
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SEO />
        <ConsentBanner />
        <NotifierContainer />
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
          <ProgressBar height="4px" color={fr.colors.decisions.background.active.blueFrance.default} />
          <Component {...pageProps} />
        </ServicesContext.Provider>
      </ThemeProvider>
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
export default App;
