import { useCallback, useState } from 'react';

import Button from '@/components/ui/Button';

const COOKIE_NAME = 'fcu-anonymize';

const getAnonymizeState = (): boolean => {
  if (typeof document === 'undefined') {
    return false;
  }
  return document.cookie.includes(`${COOKIE_NAME}=1`);
};

const setAnonymizeCookie = (enabled: boolean) => {
  if (enabled) {
    // biome-ignore lint/suspicious/noDocumentCookie: simple cookie toggle, no library needed
    document.cookie = `${COOKIE_NAME}=1; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
  } else {
    // biome-ignore lint/suspicious/noDocumentCookie: simple cookie toggle, no library needed
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
  }
};

const AnonymizeToggle = () => {
  const [enabled, setEnabled] = useState(getAnonymizeState);

  const toggle = useCallback(() => {
    const next = !enabled;
    setAnonymizeCookie(next);
    setEnabled(next);
  }, [enabled]);

  return (
    <div className="flex items-center gap-3">
      <Button priority={enabled ? 'primary' : 'secondary'} iconId={enabled ? 'ri-eye-off-line' : 'ri-eye-line'} onClick={toggle}>
        {enabled ? 'Anonymisation activée' : 'Anonymiser les données'}
      </Button>
      {enabled && <span className="text-sm text-faded">Les données personnelles seront masquées dans l'espace gestionnaire.</span>}
    </div>
  );
};

export default AnonymizeToggle;
