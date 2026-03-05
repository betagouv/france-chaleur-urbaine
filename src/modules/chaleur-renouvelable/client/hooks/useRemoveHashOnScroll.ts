import { useRouter } from 'next/router';
import { useEffect } from 'react';

export function useRemoveHashOnScroll(hashToRemove: string) {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!router.isReady) return;

    let removed = false;
    let ignoreUntil = 0; // timestamp : on ignore la suppression pendant un court laps après un clic ancre

    const shouldRemove = () => {
      if (removed) return false;
      if (Date.now() < ignoreUntil) return false;

      const currentHash = window.location.hash;
      return !!currentHash && currentHash === hashToRemove;
    };

    const removeHash = () => {
      if (!shouldRemove()) return;
      removed = true;

      const nextUrl = router.asPath.split('#')[0];
      window.history.replaceState(window.history.state, '', nextUrl);
      setTimeout(() => {
        router.replace(nextUrl, undefined, { scroll: false, shallow: true }).catch(() => {});
      }, 0);

      cleanup();
    };

    // Si l’utilisateur clique sur un lien d’ancre, on n’enlève pas le hash
    const onClickCapture = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const a = target?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!a) return;

      // si c'est exactement l'ancre qu'on gère (ou n'importe quelle ancre, à ton choix)
      if (a.getAttribute('href') === hashToRemove) {
        ignoreUntil = Date.now() + 800; // laisse le temps au jump
      }
    };

    const onWheel = () => removeHash();
    const onTouchMove = () => removeHash();
    const onKeyDown = (e: KeyboardEvent) => {
      // touches qui peuvent déclencher un scroll
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(e.key)) removeHash();
    };

    const cleanup = () => {
      window.removeEventListener('click', onClickCapture, true);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKeyDown);
    };

    window.addEventListener('click', onClickCapture, true);
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('keydown', onKeyDown);

    return cleanup;
  }, [hashToRemove, router.isReady, router.asPath]);
}
