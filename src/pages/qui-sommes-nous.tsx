import SimplePage from '@components/shared/page/SimplePage';
import Us from '@components/Us';

const QuiSommesNous = () => {
  return (
    <SimplePage
      title="Qu'est-ce que France Chaleur Urbaine ?"
      noTitleSuffix
      description="Service gratuit proposé par l’État qui promeut le chauffage urbain"
    >
      <Us />
    </SimplePage>
  );
};

export default QuiSommesNous;
