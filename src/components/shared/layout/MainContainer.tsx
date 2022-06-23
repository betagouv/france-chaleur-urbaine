import React, { useContext, useEffect } from 'react';
import LayoutContext from './LayoutContext';
import { MainLayoutStyle } from './MainLayout.style';

const MainContainer: React.FC<{
  currentMenu?: string;
  fullscreen?: boolean;
}> = ({ children, currentMenu, fullscreen }) => {
  const { setCurrentMenu, setFullscreen } = useContext(LayoutContext);

  useEffect(() => {
    if (currentMenu) setCurrentMenu(currentMenu);
    setFullscreen(!!fullscreen);
    const domBurgerBtn = document.getElementById(
      'fr-btn-menu-mobile-4'
    ) as HTMLButtonElement;
    if (domBurgerBtn?.dataset?.frOpened === 'true') domBurgerBtn.click();
  }, [currentMenu, fullscreen, setCurrentMenu, setFullscreen]);

  return (
    <>
      <MainLayoutStyle />
      <div>{children}</div>{' '}
    </>
  );
};

export default MainContainer;
