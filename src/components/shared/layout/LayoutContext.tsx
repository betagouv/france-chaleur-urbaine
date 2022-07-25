import React, { useState } from 'react';

const context = {
  currentMenu: '',
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
  return (
    <LayoutContext.Provider
      value={{ currentMenu, setCurrentMenu, fullscreen, setFullscreen }}
    >
      {children}
    </LayoutContext.Provider>
  );
};
