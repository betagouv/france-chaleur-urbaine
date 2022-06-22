import ConsentBanner from '@components/ConsentBanner';
import {
  FacebookMarkup,
  GoogleAdsMarkup,
  LinkedInMarkup,
  MatomoMarkup,
} from '@components/Markup';
import Document, {
  DocumentContext,
  Head,
  Html,
  Main,
  NextScript,
} from 'next/document';
import { ServerStyleSheet } from 'styled-components';

export default class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const sheet = new ServerStyleSheet();
    const originalRenderPage = ctx.renderPage;

    try {
      ctx.renderPage = () =>
        originalRenderPage({
          enhanceApp: (App) => (props) =>
            sheet.collectStyles(<App {...props} />),
        });

      const initialProps = await Document.getInitialProps(ctx);
      return {
        ...initialProps,
        styles: (
          <>
            {initialProps.styles}
            {sheet.getStyleElement()}
          </>
        ),
      };
    } finally {
      sheet.seal();
    }
  }

  render() {
    return (
      <Html lang="fr" prefix="og: http://ogp.me/ns#">
        <Head>
          <ConsentBanner>
            <MatomoMarkup
              matomoUrl={`${process.env.NEXT_PUBLIC_MATOMO_URL}`}
              siteId={`${process.env.NEXT_PUBLIC_MATOMO_SITE_ID}`}
            />
            <GoogleAdsMarkup googleId="10794036298" />
            <FacebookMarkup facebookId="3064783047067401" />
            <LinkedInMarkup tagId="3494650" />
          </ConsentBanner>
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
