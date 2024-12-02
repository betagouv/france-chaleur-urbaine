import SimplePage from '@components/shared/page/SimplePage';
import Us from '@components/Us';

const QuiSommesNous = () => {
  return (
    <SimplePage
      title="Qu'est-ce que France Chaleur Urbaine ?"
      noTitleSuffix
      description="Un service de l'Etat pour accélérer le développement du chauffage urbain, un mode de chauffage écologique et local."
    >
      <Us />
    </SimplePage>
  );
};

export default QuiSommesNous;
