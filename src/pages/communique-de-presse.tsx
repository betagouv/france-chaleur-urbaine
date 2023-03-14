import Press from '@components/Press';
import MainContainer from '@components/shared/layout/MainContainer';

const QuiSommesNous = () => {
  return (
    <MainContainer currentMenu={'/communique-de-presse'}>
      <Press />
    </MainContainer>
  );
};

export default QuiSommesNous;
