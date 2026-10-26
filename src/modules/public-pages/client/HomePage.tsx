import { useQueryState } from 'nuqs';
import { useCallback } from 'react';

import SimplePage from '@/components/shared/page/SimplePage';
import { useTrackPageView } from '@/modules/conversion-tracking/client/useTrackPageView';

import { HomeHero } from './HomeHero';
import { homeFormModeParser } from './home-form';
import { PublicPageProvider, scrollToPageTop } from './PublicPageContext';
import { PublicPageSections } from './PublicPageSections';
import { ToolsTabsSection } from './ToolsTabsSection';

/**
 * Home page: address test banner, tool tiles and the editorial sections shared with the
 * renewable heating landing page. The "Comparer les solutions" CTAs scroll back to the
 * form with the comparator mode preselected.
 */
export default function HomePage() {
  useTrackPageView();
  const [, setMode] = useQueryState('mode', homeFormModeParser);
  const handleCompareSolutions = useCallback(() => {
    void setMode('comparateur');
    scrollToPageTop();
  }, [setMode]);

  return (
    <SimplePage
      title="Développer le chauffage urbain"
      description="Vérifiez si votre bâtiment est raccordable à un réseau de chaleur ou comparez les solutions de chauffage écologique adaptées à votre logement."
    >
      <HomeHero />
      <ToolsTabsSection />
      <PublicPageProvider source="home" onCompareSolutions={handleCompareSolutions}>
        <PublicPageSections />
      </PublicPageProvider>
    </SimplePage>
  );
}
