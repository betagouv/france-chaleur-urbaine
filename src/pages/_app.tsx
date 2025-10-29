import '@/app/globals.css';
import { PagesProgressProvider as ProgressProvider } from '@bprogress/next';
import { fr } from '@codegouvfr/react-dsfr';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import type Link from 'next/link';
import { SessionProvider } from 'next-auth/react';
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
import { ServicesContext } from '@/services';
import { legacyServices } from '@/services/legacy-services';

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

  return (
    <ProgressProvider height="4px" color={fr.colors.decisions.background.active.blueFrance.default} shallowRouting>
      <QueryClientProvider client={queryClient}>
        <NuqsAdapter>
          <ServicesContext.Provider value={legacyServices}>
            <AppInner {...props} />
          </ServicesContext.Provider>
        </NuqsAdapter>
      </QueryClientProvider>
    </ProgressProvider>
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
