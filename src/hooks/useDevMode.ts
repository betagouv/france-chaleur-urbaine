import { useMemo } from 'react';

import useLocalStorage from './useLocalStorage';

declare let window: Window & {
  devModeEnabled?: boolean;
};

function useDevMode() {
  const { value: devModeEnabled, set: setDevMode } = useLocalStorage<boolean, boolean, true>(`devModeEnabled`, {
    defaultValue: false,
  });

  useMemo(() => {
    if (global.window) {
      window.devModeEnabled = devModeEnabled;
    }
  }, [global.window, devModeEnabled]);

  return {
    devModeEnabled,
    toggleDevMode: () => {
      setDevMode(!devModeEnabled);
    },
  };
}

export default useDevMode;

export function isDevModeEnabled() {
  return typeof window !== 'undefined' && !!window.devModeEnabled;
}
