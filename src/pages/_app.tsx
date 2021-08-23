import { fetchHttpClient } from '@components/lib';
import '@gouvfr/dsfr/dist/css/dsfr.min.css';
import '@reach/combobox/styles.css';
import type { AppProps } from 'next/app';
import React from 'react';
import {
  HeatNetworkService,
  ServicesContext,
  SuggestionService,
} from 'src/services';

function MyApp({ Component, pageProps }: AppProps) {
  React.useEffect(() => {
    import('@gouvfr/dsfr/dist/js/dsfr.module.min.js');
  }, []);
  return (
    <>
      <ServicesContext.Provider
        value={{
          suggestionService: new SuggestionService(fetchHttpClient),
          heatNetworkService: new HeatNetworkService(fetchHttpClient),
        }}
      >
        <Component {...pageProps} />
      </ServicesContext.Provider>
    </>
  );
}
export default MyApp;
