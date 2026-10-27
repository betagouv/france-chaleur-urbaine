import { BenefitsSection } from './sections/BenefitsSection';
import { FaqSection } from './sections/FaqSection';
import { ResourcesCarouselSection } from './sections/ResourcesCarouselSection';
import { SolutionsIllustrationSection } from './sections/SolutionsIllustrationSection';
import { StepsTimelineSection } from './sections/StepsTimelineSection';
import { TestimonialsSection } from './sections/TestimonialsSection';

/**
 * The editorial sections shared by the home page and the renewable heating landing page,
 * in their reference order. Must be rendered inside a `PublicPageProvider`.
 */
export function PublicPageSections() {
  return (
    <>
      <BenefitsSection />
      <SolutionsIllustrationSection />
      <StepsTimelineSection variant="light" />
      <ResourcesCarouselSection />
      <FaqSection />
      <TestimonialsSection variant="light" />
    </>
  );
}
