import { CookieConsentButton } from '@/components/ConsentBanner/CookieConsentButton';
import SimplePage from '@/components/shared/page/SimplePage';
import { LegalArticle } from '@/modules/legal/client/LegalArticle';
import Content from '@/modules/legal/content/politique-de-confidentialite.mdx';

function PolitiqueDeConfidentialitePage() {
  return (
    <SimplePage
      title="Politique de confidentialité"
      description="Données personnelles traitées par France Chaleur Urbaine, prestataires, cookies et exercice de vos droits"
      layout="center"
    >
      <LegalArticle content={Content} components={{ CookieConsentButton }} />
    </SimplePage>
  );
}

export default PolitiqueDeConfidentialitePage;
