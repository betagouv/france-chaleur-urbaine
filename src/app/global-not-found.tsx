import './globals.css';
import '@codegouvfr/react-dsfr/main.css';
import '@codegouvfr/react-dsfr/dsfr/dsfr.css';
import '@codegouvfr/react-dsfr/dsfr/utility/icons/icons.css';

export default function GlobalNotFound() {
  return (
    <html lang="fr" data-fr-scheme="light" data-fr-theme="light">
      <head>
        <title>Page non trouvée : France Chaleur Urbaine</title>
      </head>
      <body className="fr-container fr-py-8w">
        <h1 className="fr-h3">Page non trouvée</h1>
        <p className="fr-mb-3w">La page que vous recherchez n'existe pas ou a été déplacée.</p>
        <a href="/" className="fr-link fr-icon-arrow-left-line fr-link--icon-left">
          Retour à l'accueil
        </a>
      </body>
    </html>
  );
}
