import Document, { Head, Html, Main, NextScript, type DocumentContext } from 'next/document';
import { ServerStyleSheet } from 'styled-components';

import { augmentDocumentWithEmotionCache, dsfrDocumentApi } from '@/components/Theme/ThemeProvider';

const { augmentDocumentForDsfr } = dsfrDocumentApi;

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const sheet = new ServerStyleSheet();
    const originalRenderPage = ctx.renderPage;

    try {
      ctx.renderPage = () =>
        originalRenderPage({
          enhanceApp: (App) => (props) => sheet.collectStyles(<App {...props} />),
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
      <Html lang="fr" data-fr-scheme="light" data-fr-theme="light" prefix="og: http://ogp.me/ns#">
        <Head />
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;

augmentDocumentForDsfr(MyDocument);

augmentDocumentWithEmotionCache(Document);
