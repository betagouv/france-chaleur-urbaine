import { useRouter } from 'next/router';
import { useContext } from 'react';
import Footer from './Footer';
import Header from './Header';
import LayoutContext from './LayoutContext';
export {
  footerHeight,
  fullscreenFooterHeight,
  fullscreenHeaderHeight,
  headerHeight,
  tabFooterHeight,
  tabHeaderHeight,
} from './MainLayout.data';

type MainLayout = {
  children?: React.ReactNode;
  fullscreen?: boolean;
};

const MainLayout: React.FC<MainLayout> = ({ children }) => {
  const { currentMenu, fullscreen } = useContext(LayoutContext);
  const router = useRouter();

  if (router.pathname === '/form') {
    return <div>{children}</div>;
  }

  return (
    <>
      <Header fullscreen={fullscreen} currentMenu={currentMenu} />
      <div>{children}</div>
      <Footer />
    </>
  );
};
export default MainLayout;
