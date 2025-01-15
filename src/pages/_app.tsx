import '@/styles/globals.css';
import { fr } from '@codegouvfr/react-dsfr';
import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import type Link from 'next/link';
import { type Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
// use AppProgressBar instead of PagesProgressBar on purpose as it handles better the query params ignoring
import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';
import { SWRConfig, type SWRConfiguration } from 'swr';

import '@/components/Map/StyleSwitcher/styles.css';
import SEO from '@/components/SEO';
import ThemeProvider, { augmentDocumentWithEmotionCache, dsfrDocumentApi } from '@/components/Theme/ThemeProvider';
import { usePreserveScroll } from '@/hooks/usePreserveScroll';
import { HeatNetworkService, ServicesContext, SuggestionService } from '@/services';
import { AdminService } from '@/services/admin';
import { useAnalytics } from '@/services/analytics';
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

export { augmentDocumentWithEmotionCache, dsfrDocumentApi };

const swrConfig: SWRConfiguration = {
  revalidateOnFocus: false,
};

function App({
  Component,
  pageProps,
}: AppProps<{
  session: Session;
}>) {
  usePreserveScroll();
  useAnalytics();

  return (
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
        <SWRConfig value={swrConfig}>
          <SessionProvider session={pageProps.session}>
            <ProgressBar height="4px" color={fr.colors.decisions.background.active.blueFrance.default} />
            <Component {...pageProps} />
          </SessionProvider>
        </SWRConfig>
      </ServicesContext.Provider>
    </ThemeProvider>
  );
}
export default App;
