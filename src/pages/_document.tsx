import Document, { type DocumentContext, Head, Html, Main, NextScript } from 'next/document';
import { ServerStyleSheet } from 'styled-components';

import { dsfrDocumentApi } from './_app';

const { augmentDocumentForDsfr } = dsfrDocumentApi;

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const sheet = new ServerStyleSheet();
    const originalRenderPage = ctx.renderPage;

    // Note: Ici, ctx.req est undefined quand on est en mode static generation (ce qui est le cas sur plusieurs pages du site)
    // Cela rend impossible d'accéder à la locale de l'utilisateur ou à son user-agent
    // Si des variables doivent être ajoutées à <html />, utiliser le hook useHtmlAttributes.ts

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
