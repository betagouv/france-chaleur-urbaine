import Link from 'next/link';

import { trackEvent } from 'src/services/analytics';

import { Guide } from './CoproGuide.styles';

const CoproGuide = ({ guideClassName }: { guideClassName?: string }) => {
  return (
    <Guide className={guideClassName}>
      <img src="/img/copro_guide.png" alt="Guide de raccordement" />
      <div>
        <div className="fr-btn fr-mt-2w fr-ml-4w">
          <Link
            href="/documentation/guide-france-chaleur-urbaine.pdf"
            target="_blank"
            rel="noreferrer noopener"
            onClick={() => {
              trackEvent('Téléchargement|Guide FCU|coproprietaire');
            }}
          >
            Télécharger notre guide
          </Link>
        </div>
      </div>
    </Guide>
  );
};

export default CoproGuide;
