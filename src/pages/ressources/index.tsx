import Ressources from '@components/Ressources/Ressources';
import MainContainer from '@components/shared/layout';
import { createGlobalStyle } from 'styled-components';
const Style = createGlobalStyle`
.issue-img {
  display: none;
  @media (min-width: 992px) {
    display: block;
    max-width: 500px;
  }
}`;

const RessourcesPage = () => {
  return (
    <MainContainer currentMenu={'/ressources'}>
      <Style />
      <Ressources />
    </MainContainer>
  );
};

export default RessourcesPage;
