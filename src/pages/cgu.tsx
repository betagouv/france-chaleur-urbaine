import SimplePage from '@/components/shared/page/SimplePage';
import { LegalArticle } from '@/modules/legal/client/LegalArticle';
import Content from '@/modules/legal/content/cgu.mdx';

function CGUPage() {
  return (
    <SimplePage
      title="Conditions générales d'utilisation"
      description="Conditions d'utilisation de France Chaleur Urbaine : fonctionnalités, engagements des utilisateurs et des gestionnaires, limites de responsabilité"
      layout="center"
    >
      <LegalArticle content={Content} />
    </SimplePage>
  );
}

export default CGUPage;
