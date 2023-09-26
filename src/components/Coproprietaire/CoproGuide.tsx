import { Guide } from './CoproGuide.styles';
import Link from 'next/link';

const CoproGuide = ({ guideClassName }: { guideClassName?: string }) => {
  return (
    <Guide className={guideClassName}>
      <img src="/img/copro_guide.png" alt="Guide de raccordement" />
      <div className="fr-btn fr-mt-2w fr-ml-4w">
        <Link
          href="/documentation/guide-france-chaleur-urbaine.pdf"
          target="_blank"
        >
          Télécharger notre guide
        </Link>
      </div>
    </Guide>
  );
};

export default CoproGuide;
