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
import React from 'react';
import { ServerStyleSheet } from 'styled-components';

const imagePreview = './img/preview/fcu-preview-20211210.min.jpg';

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
      <Html lang="fr" prefix="og: http://ogp.me/ns#">
        <Head>
          {favicons.map(
            (
              faviconProps: { rel: string; href: string; type?: string },
              i: number
            ) => (
              <link key={i} {...faviconProps} />
            )
          )}
          {/* <!-- HTML Meta Tags --> */}
          <title>
            Facilitez le raccordement à un chauffage économique et écologique
          </title>
          <meta
            name="description"
            content="Un réseau de chaleur est un système de distribution de chaleur produite de façon centralisée qui permet de desservir un grand nombre d’usagers (bâtiments tertiaires publics ou privés, copropriétés, logements sociaux,...). Un des atouts majeurs des réseaux de chaleur est de permettre de mobiliser les énergies renouvelables présentes sur le territoire, difficilement distribuables autrement."
          />

          {/* <!-- Facebook Meta Tags --> */}
          <meta
            property="og:url"
            content="https://france-chaleur-urbaine.beta.gouv.fr/"
          />
          <meta property="og:type" content="website" />
          <meta
            property="og:title"
            content="Facilitez le raccordement à un chauffage économique et écologique"
          />
          <meta
            property="og:description"
            content="Un réseau de chaleur est un système de distribution de chaleur produite de façon centralisée qui permet de desservir un grand nombre d’usagers (bâtiments tertiaires publics ou privés, copropriétés, logements sociaux,...). Un des atouts majeurs des réseaux de chaleur est de permettre de mobiliser les énergies renouvelables présentes sur le territoire, difficilement distribuables autrement."
          />
          <meta property="og:image" content={imagePreview} />

          {/* <!-- Twitter Meta Tags --> */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta
            property="twitter:domain"
            content="france-chaleur-urbaine.beta.gouv.fr"
          />
          <meta
            property="twitter:url"
            content="https://france-chaleur-urbaine.beta.gouv.fr/"
          />
          <meta
            name="twitter:title"
            content="Facilitez le raccordement à un chauffage économique et écologique"
          />
          <meta
            name="twitter:description"
            content="Un réseau de chaleur est un système de distribution de chaleur produite de façon centralisée qui permet de desservir un grand nombre d’usagers (bâtiments tertiaires publics ou privés, copropriétés, logements sociaux,...). Un des atouts majeurs des réseaux de chaleur est de permettre de mobiliser les énergies renouvelables présentes sur le territoire, difficilement distribuables autrement."
          />
          <meta name="twitter:image" content={imagePreview} />

          {/* <!-- Meta Tags Generated via https://www.opengraph.xyz --> */}

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
