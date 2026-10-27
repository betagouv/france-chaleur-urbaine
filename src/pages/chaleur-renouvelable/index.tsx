import { useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

import SimplePage from '@/components/shared/page/SimplePage';
import Notice from '@/components/ui/Notice';
import { trackPostHogEvent } from '@/modules/analytics/client';
import ChoixChauffageForm from '@/modules/chaleur-renouvelable/client/ChoixChauffageForm';
import { useTrackPageView } from '@/modules/conversion-tracking/client/useTrackPageView';
import { PublicPageProvider } from '@/modules/public-pages/client/PublicPageContext';
import { PublicPageSections } from '@/modules/public-pages/client/PublicPageSections';

const SCROLL_DEPTHS = [25, 50, 75, 100] as const;

/**
 * Renewable heating landing page (`/chaleur-renouvelable`): the simulator form in the
 * banner, followed by the editorial sections shared with the home page.
 */
export default function ChaleurRenouvelablePage() {
  useTrackPageView();
  const searchParams = useSearchParams();
  const isFromPacoupa = searchParams?.get('src') === 'pacoupa';
  useScrollDepthTracking();

  return (
    <SimplePage
      title="Découvrez le chauffage qui vous convient !"
      currentPage="/chaleur-renouvelable"
      description="Découvrez les modes de chauffage renouvelables adaptés à votre logement"
    >
      {isFromPacoupa && (
        <Notice onClose={() => null} variant="info">
          Pacoupa est désormais un service intégré à France Chaleur Urbaine, un service de l’ADEME
        </Notice>
      )}
      <div className="fr-p-1w md:fr-p-5w w-full bg-[#C3E4E2] bg-[url('/img/banner_simulateur.webp')] bg-no-repeat bg-cover bg-left-center">
        <div className="fr-container">
          <h1 className="fr-mt-2w md:fr-mt-5w text-white">
            Rejoignez les 13 millions de français
            <br /> qui se chauffent autrement
          </h1>
          <div className="rounded border-2 border-blue-600 bg-white p-6 shadow-sm">
            <h2 className="text-2xl hidden md:block">Trouvez la meilleure solution de chauffage écologique et économique en 3 clics !</h2>
            <h2 className="text-2xl md:hidden">Votre chauffage écologique et économique en 3 clics</h2>
            <ChoixChauffageForm />
          </div>
        </div>
      </div>
      <PublicPageProvider source="fcr_landing">
        <PublicPageSections />
      </PublicPageProvider>
    </SimplePage>
  );
}

/** Emits one PostHog event per scroll depth milestone reached during the visit. */
function useScrollDepthTracking() {
  const trackedDepthsRef = useRef(new Set<number>());

  // Scroll listener registered once; the ref keeps each milestone from firing twice
  useEffect(() => {
    const handleScroll = () => {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollableHeight <= 0) {
        return;
      }

      const depthPercent = Math.min(100, Math.round((window.scrollY / scrollableHeight) * 100));
      SCROLL_DEPTHS.filter((depth) => depthPercent >= depth && !trackedDepthsRef.current.has(depth)).forEach((depth) => {
        trackedDepthsRef.current.add(depth);
        trackPostHogEvent('fcr_landing:scroll_depth_reached', { depth_percent: depth });
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
}
