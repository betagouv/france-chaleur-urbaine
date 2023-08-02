import { useRouter } from 'next/router';
import { useContext } from 'react';
import { iframedPaths } from 'src/services/iframe';
import Footer from './Footer';
import Header from './Header';
import LayoutContext from './LayoutContext';
export {
  footerHeight,
  fullscreenFooterHeight,
  fullscreenHeaderHeight,
  headerHeight,
  tabFooterHeight,
} from './MainLayout.data';

type MainLayout = {
  children?: React.ReactNode;
  fullscreen?: boolean;
};

const MainLayout: React.FC<MainLayout> = ({ children }) => {
  const { currentMenu, fullscreen } = useContext(LayoutContext);
  const router = useRouter();

  if (iframedPaths.some((path) => router.pathname.match(path))) {
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
