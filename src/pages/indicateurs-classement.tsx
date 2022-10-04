import Indicators from '@components/Indicators/Indicators';
import MainContainer from '@components/shared/layout';

const IndicateursClassement = () => {
  return (
    <MainContainer currentMenu={'/indicateurs-classement'}>
      <Indicators />
    </MainContainer>
  );
};

export default IndicateursClassement;
