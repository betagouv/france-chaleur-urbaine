import PrivacyPolicyComponent from '@incubateur-ademe/legal-pages-react/PrivacyPolicyClient';

import SimplePage from '@/components/shared/page/SimplePage';

function PolitiqueDeConfidentialitePage() {
  return (
    <SimplePage
      title="Politique de confidentialité"
      description="Politique de protection des données personnelles de la plateforme France Chaleur Urbaine"
      layout="center"
    >
      <h1 className="fr-sr-only">Politique de confidentialité</h1>
      <section aria-labelledby="origine-demandes">
        <h2 id="origine-demandes">Provenance de votre demande</h2>
        <p>
          Pour comprendre quels canaux permettent de découvrir le service, l’équipe France Chaleur Urbaine conserve avec votre demande des
          informations sur sa provenance : domaine du site référent, pages d’arrivée et du formulaire sans paramètres d’URL, campagne et, le
          cas échéant, site partenaire intégrant le service. Ces informations sont réservées à l’administration du service.
        </p>
        <p>
          Cette attribution utilise uniquement la mémoire de la page pendant votre navigation. Elle ne dépose aucun cookie, n’utilise aucun
          stockage dans votre navigateur et est perdue au rechargement ou à l’ouverture d’un nouvel onglet indépendant. Elle ne déclenche
          aucun envoi supplémentaire à un service tiers.
        </p>
      </section>
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
        ]}
      />
    </SimplePage>
  );
}

export default PolitiqueDeConfidentialitePage;
