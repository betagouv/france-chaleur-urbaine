import { matomoEvent } from '@components/Markup';
import { Button } from '@dataesr/react-dsfr';
import { Guide } from './CoproGuide.styles';

const CoproGuide = ({ guideClassName }: { guideClassName?: string }) => {
  return (
    <Guide className={guideClassName}>
      <img src="/img/copro_guide.png" alt="Guide de raccordement" />
      <div>
        <Button
          onClick={() => {
            matomoEvent(['Téléchargement', 'Guide FCU', 'coproprietaire']);
            window.open(
              '/documentation/guide-france-chaleur-urbaine.pdf',
              '_blank'
            );
          }}
        >
          Télécharger notre guide
        </Button>
      </div>
    </Guide>
  );
};

export default CoproGuide;
