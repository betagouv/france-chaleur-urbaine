import { PrivacyPolicy } from '@incubateur-ademe/legal-pages-react';

import SimplePage from '@/components/shared/page/SimplePage';

function PolitiqueDeConfidentialitePage() {
  return (
    <SimplePage
      title="Politique de confidentialité"
      description="Politique de protection des données personnelles de la plateforme France Chaleur Urbaine"
      layout="center"
    >
      <PrivacyPolicy
        includeBetaGouv
        cookieConsentButton={<button>CLICK</button>}
        siteName="France Chaleur Urbaine"
        date="08/09/2025"
        cookies={[
          {
            category: 'Mesure d’audience anonymisée',
            name: 'Matomo',
            expiration: '13 mois',
            finalities: 'Mesure d’audience',
            editor: 'Matomo & ADEME',
            destination: 'France',
          },
        ]}
        thirdParties={[
          {
            name: 'Scalingo',
            country: 'France',
            hostingCountry: 'France',
            serviceType: 'Hébergement site',
            policyUrl: 'https://scalingo.com/fr/informations-legales',
          },
          {
            name: 'Scalingo',
            country: 'France',
            hostingCountry: 'France',
            serviceType: 'Base de données',
            policyUrl: 'https://scalingo.com/fr/informations-legales',
          },
          {
            name: 'Airtable',
            country: 'États-Unis',
            hostingCountry: 'États-Unis',
            serviceType: 'Base de données',
            policyUrl: 'https://www.airtable.com/company/tos/fr',
          },
        ]}
      />
    </SimplePage>
  );
}

export default PolitiqueDeConfidentialitePage;
