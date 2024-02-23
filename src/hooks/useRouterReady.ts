import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

/**
 * Returns router.isReady in an effect.
 * We can't use router.isReady directly because it produces next.js hydratation errors
 */
export default function useRouterReady() {
  const router = useRouter();

  const [isPageReady, setIsPageReady] = useState(false);
  useEffect(() => {
    setIsPageReady(router.isReady);
  }, [router.isReady]);

  return isPageReady;
}
