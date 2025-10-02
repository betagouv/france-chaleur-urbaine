import type { PrivacyPolicy } from '@incubateur-ademe/legal-pages-react';
import PrivacyPolicyClient from '@incubateur-ademe/legal-pages-react/PrivacyPolicyClient';

import SimplePage from '@/components/shared/page/SimplePage';

const PrivacyPolicyComponent = PrivacyPolicyClient as unknown as typeof PrivacyPolicy;
function PolitiqueDeConfidentialitePage() {
  return (
    <SimplePage
      title="Politique de confidentialité"
      description="Politique de protection des données personnelles de la plateforme France Chaleur Urbaine"
      layout="center"
    >
      <h1 className="fr-sr-only">Politique de confidentialité</h1>
      <PrivacyPolicyComponent
        cookieConsentButton={<button>CLICK</button>}
        siteName="France Chaleur Urbaine"
        date="08/09/2025"
        cookies={[
          {
            category: 'Mesure d’audience anonymisée',
            destination: 'France',
            editor: 'Matomo & ADEME',
            expiration: '13 mois',
            finalities: 'Mesure d’audience',
            name: 'Matomo',
          },
        ]}
        thirdParties={[
          {
            country: 'France',
            hostingCountry: 'France',
            name: 'Scalingo',
            policyUrl: 'https://scalingo.com/fr/informations-legales',
            serviceType: 'Hébergement site',
          },
          {
            country: 'France',
            hostingCountry: 'France',
            name: 'Scalingo',
            policyUrl: 'https://scalingo.com/fr/informations-legales',
            serviceType: 'Base de données',
          },
          {
            country: 'États-Unis',
            hostingCountry: 'États-Unis',
            name: 'Airtable',
            policyUrl: 'https://www.airtable.com/company/tos/fr',
            serviceType: 'Base de données',
          },
        ]}
      />
    </SimplePage>
  );
}

export default PolitiqueDeConfidentialitePage;
