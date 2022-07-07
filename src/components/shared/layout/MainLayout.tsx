import { useContext } from 'react';
import Footer from './Footer';
import Header from './Header';
import LayoutContext from './LayoutContext';
import { Main } from './MainLayout.style';
export {
  footerHeight,
  fullscreenFooterHeight,
  fullscreenHeaderHeight,
  headerHeight,
  tabFooterHeight,
  tabHeaderHeight,
} from './MainLayout.data'; // TODO: remove this and use index.ts

type MainLayout = {
  children: React.ReactNode;
  fullscreen?: boolean;
};

const MainLayout: React.FC<MainLayout> = ({ children }) => {
  const { currentMenu, fullscreen } = useContext(LayoutContext);
  return (
    <>
      <Header fullscreen={fullscreen} currentMenu={currentMenu} />
      <Main fullscreen={fullscreen}>{children}</Main>
      <Footer />
    </>
  );
};
export default MainLayout;
