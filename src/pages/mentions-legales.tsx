import SimplePage from '@/components/shared/page/SimplePage';
import { LegalArticle } from '@/modules/legal/client/LegalArticle';
import Content from '@/modules/legal/content/mentions-legales.mdx';

function MentionsLegalesPage() {
  return (
    <SimplePage
      title="Mentions légales"
      description="Éditeur, hébergeur et conditions de réutilisation de France Chaleur Urbaine, service public numérique de l'ADEME"
      layout="center"
    >
      <LegalArticle content={Content} />
    </SimplePage>
  );
}

export default MentionsLegalesPage;
