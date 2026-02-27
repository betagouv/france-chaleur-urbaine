import { useEffect, useState } from 'react';

export default function useIsMobile(maxWidth = 600) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${maxWidth}px)`);

    const onChange = () => setIsMobile(mql.matches);
    onChange();

    mql.addEventListener?.('change', onChange);
    return () => mql.removeEventListener?.('change', onChange);
  }, [maxWidth]);

  return isMobile;
}
