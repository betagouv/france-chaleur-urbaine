import React, { useEffect, useState } from 'react';

const context = {
  currentMenu: '',
  indexLink: '/',
  fullscreen: false,
  setFullscreen: (() => undefined) as React.Dispatch<boolean>,
  setCurrentMenu: (() => undefined) as React.Dispatch<string>,
};

export const LayoutContext = React.createContext(context);
export default LayoutContext;

export const LayoutProvider: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const [currentMenu, setCurrentMenu] = useState('/');
  const [fullscreen, setFullscreen] = useState(false);
  const [indexLink, setIndexLink] = useState('/');

  useEffect(() => {
    if (currentMenu === '/accueil') {
      setIndexLink('/accueil');
    }
  }, [currentMenu]);

  return (
    <LayoutContext.Provider
      value={{
        currentMenu,
        setCurrentMenu,
        fullscreen,
        setFullscreen,
        indexLink,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
};
