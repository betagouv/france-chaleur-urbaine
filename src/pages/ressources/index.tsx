import Ressources from '@components/Ressources/Ressources';
import SimplePage from '@components/shared/page/SimplePage';
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
    <SimplePage>
      <Style />
      <Ressources />
    </SimplePage>
  );
};

export default RessourcesPage;
