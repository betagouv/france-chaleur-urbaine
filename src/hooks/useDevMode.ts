import { useCallback, useMemo } from 'react';

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

  const toggleDevMode = useCallback(() => {
    setDevMode(!devModeEnabled);
  }, [devModeEnabled, setDevMode]);

  return {
    devModeEnabled,
    toggleDevMode,
  };
}

export default useDevMode;

export function isDevModeEnabled() {
  return typeof window !== 'undefined' && !!window.devModeEnabled;
}
