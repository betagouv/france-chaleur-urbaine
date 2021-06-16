import '@gouvfr/dsfr/dist/css/dsfr.min.css';
import '@reach/combobox/styles.css';
import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';

const DynamicComponentWithNoSSR = dynamic(
  () =>
    import('@gouvfr/dsfr/dist/js/dsfr.module.min.js').then((m) => m.toString()),
  { ssr: false }
);

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <DynamicComponentWithNoSSR />
      <Component {...pageProps} />
    </>
  );
}
export default MyApp;
