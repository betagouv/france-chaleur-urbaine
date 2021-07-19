import Document, {
  DocumentContext,
  Head,
  Html,
  Main,
  NextScript,
} from 'next/document';
import React from 'react';
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
      <Html>
        <Head />
        <body>
          <script
            dangerouslySetInnerHTML={{
              __html: `
              /* Matomo */
               var _paq = window._paq = window._paq || [];
              _paq.push(['trackPageView']);
              _paq.push(["disableCookies"]);
              _paq.push(['enableLinkTracking']);
              (function() {
                var u="${process.env.NEXT_PUBLIC_MATOMO_URL}";
                _paq.push(['setTrackerUrl', u+'matomo.php']);
                _paq.push(['setSiteId', '${process.env.NEXT_PUBLIC_MATOMO_SITE_ID}']);
                var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
                g.type='text/javascript'; g.async=true; g.defer=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
              })();
            `,
            }}
          />
          <noscript
            dangerouslySetInnerHTML={{
              __html: `<p><img src="${process.env.NEXT_PUBLIC_MATOMO_URL}/matomo.php?idsite='${process.env.NEXT_PUBLIC_MATOMO_SITE_ID}'&amp;rec=1" style="border:0;" alt="" /></p>`,
            }}
          />
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
