import { fetchHttpClient } from '@components/lib';
import '@gouvfr/dsfr/dist/css/dsfr.min.css';
import '@reach/combobox/styles.css';
import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import {
  HeatNetworkService,
  ServicesContext,
  SuggestionService,
} from 'src/services';

const DynamicComponentWithNoSSR = dynamic(
  () =>
    import('@gouvfr/dsfr/dist/js/dsfr.module.min.js').then((m) => m.toString()),
  { ssr: false }
);

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <DynamicComponentWithNoSSR />
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
