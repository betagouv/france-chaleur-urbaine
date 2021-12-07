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
import React from 'react';
import { ServerStyleSheet } from 'styled-components';

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
      <Html lang="fr">
        <Head>
          {favicons.map(
            (
              faviconProps: { rel: string; href: string; type?: string },
              i: number
            ) => (
              <link key={i} {...faviconProps} />
            )
          )}
          <MatomoMarkup
            matomoUrl={`${process.env.NEXT_PUBLIC_MATOMO_URL}`}
            siteId={`${process.env.NEXT_PUBLIC_MATOMO_SITE_ID}`}
          />
          <GoogleAdsMarkup googleId="10794036298" />
          <FacebookMarkup facebookId="3064783047067401" />
        </Head>
        <body>
          <Main />
          <NextScript />
          <LinkedInMarkup tagId="3494650" />
        </body>
      </Html>
    );
  }
}
