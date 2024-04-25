import Box from '@components/ui/Box';
import { Button } from '@dataesr/react-dsfr';
import { usePersistedState } from '@hooks';
import { useMemo, useState } from 'react';

declare let window: Window & {
  devModeEnabled?: boolean;
};

export function isDevModeEnabled(): boolean {
  return !!window.devModeEnabled;
}

function DevModeIcon() {
  const [devModeAttempts, setDevModeAttempts] = useState(0);
  const [devMode, setDevMode] = usePersistedState('devMode', false, {
    beforeStorage: (v: any) => !!v,
  });

  function tryEnableDevMode() {
    setDevModeAttempts(devModeAttempts + 1);
    if (devModeAttempts === 4) {
      setDevMode(true);
    }
    setTimeout(() => {
      setDevModeAttempts(0);
    }, 5000);
  }

  useMemo(() => {
    window.devModeEnabled = devMode;
  }, [devMode]);

  return devMode ? (
    <Button
      tertiary
      size="sm"
      icon="ri-close-line"
      onClick={() => setDevMode(false)}
      title="Désactiver le mode développeur"
    />
  ) : (
    <Box width="24px" height="24px" onClick={tryEnableDevMode} />
  );
}

export default DevModeIcon;
