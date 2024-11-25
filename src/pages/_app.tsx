import { fr } from '@codegouvfr/react-dsfr';
import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
// use AppProgressBar instead of PagesProgressBar on purpose as it handles better the query params ignoring
import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';
import { SWRConfig, SWRConfiguration } from 'swr';

import '@components/Map/StyleSwitcher/styles.css';
import SEO from '@components/SEO';
import ThemeProvider, { augmentDocumentWithEmotionCache, dsfrDocumentApi } from '@components/Theme/ThemeProvider';
import { NotifierContainer } from '@core/notification';
import { usePreserveScroll } from '@hooks/usePreserveScroll';
import { HeatNetworkService, ServicesContext, SuggestionService } from 'src/services';
import { AdminService } from 'src/services/admin';
import { useAnalytics } from 'src/services/analytics';
import { DemandsService } from 'src/services/demands';
import { ExportService } from 'src/services/export';
import { axiosHttpClient } from 'src/services/http';
import { NetworksService } from 'src/services/networks';
import { PasswordService } from 'src/services/password';

const ConsentBanner = dynamic(
  () => import('@components/ConsentBanner').then((module) => module.ConsentBanner),
  { ssr: false } // Disable server side as it
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
