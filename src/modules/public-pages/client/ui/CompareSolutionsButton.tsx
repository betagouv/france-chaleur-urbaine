import Button from '@/components/ui/Button';

import { usePublicPage } from '../PublicPageContext';

/**
 * Centered "Comparer les solutions" call to action; its behaviour comes from the page context.
 */
export function CompareSolutionsButton() {
  const { source, onCompareSolutions } = usePublicPage();

  return (
    <div className="mt-8 flex justify-center">
      <Button
        priority="primary"
        iconId="fr-icon-arrow-right-line"
        iconPosition="right"
        postHogEventKey={`${source}:bottom_cta_clicked`}
        onClick={onCompareSolutions}
      >
        Comparer les solutions
      </Button>
    </div>
  );
}
