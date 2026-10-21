import Link from '@/components/ui/Link';

import { Guide } from './CoproGuide.styles';

const CoproGuide = ({ guideClassName }: { guideClassName?: string }) => {
  return (
    <Guide className={guideClassName}>
      <img src="/img/copro_guide.png" alt="Guide de raccordement" />
      <div>
        <div className="fr-btn fr-mt-2w fr-ml-4w">
          <Link
            href="/documentation/guide-france-chaleur-urbaine.pdf"
            isExternal
            eventKey="Téléchargement|Guide FCU|coproprietaire"
            postHogEventKey="content:click"
            postHogEventProps={{ content_name: 'Guide Copropriétés', content_type: 'guide', source: 'page-ville' }}
          >
            Télécharger notre guide
          </Link>
        </div>
      </div>
    </Guide>
  );
};

export default CoproGuide;
