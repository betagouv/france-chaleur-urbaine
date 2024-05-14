import Document, {
  DocumentContext,
  Head,
  Html,
  Main,
  NextScript,
} from 'next/document';
import { ServerStyleSheet } from 'styled-components';
import { dsfrDocumentApi } from './_app';

const { getColorSchemeHtmlAttributes, augmentDocumentForDsfr } =
  dsfrDocumentApi;

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
      <Html
        lang="fr"
        prefix="og: http://ogp.me/ns#"
        {...getColorSchemeHtmlAttributes(this.props)}
      >
        <Head />
        <body>
          <Main />
          <div id="modal-root"></div>
          <NextScript />
        </body>
      </Html>
    );
  }
}

augmentDocumentForDsfr(MyDocument);
