import Accordion from '@/components/ui/Accordion';
import Section, { type SectionProps } from '@/components/ui/Section';
import { trackPostHogEvent } from '@/modules/analytics/client';

import { FAQS } from '../../constants';
import { usePublicPage } from '../PublicPageContext';
import { CompareSolutionsButton } from '../ui/CompareSolutionsButton';
import { SectionIntro } from '../ui/SectionIntro';

type FaqSectionProps = Pick<SectionProps, 'variant'>;

/**
 * "FAQ" section: accordions answering the frequent questions about changing one's heating.
 */
export function FaqSection({ variant }: FaqSectionProps) {
  const { source } = usePublicPage();

  return (
    <Section variant={variant}>
      <SectionIntro eyebrow="FAQ" title="Questions fréquentes sur mon changement de chauffage" />
      <div className="mt-8">
        {FAQS.map((faq) => (
          <Accordion
            key={faq.question}
            label={faq.question}
            onExpandedChange={(expanded) => {
              if (expanded) {
                trackPostHogEvent(`${source}:faq_item_opened`, { faq_question: faq.question });
              }
            }}
          >
            <div className="mb-0 whitespace-pre-line" dangerouslySetInnerHTML={{ __html: faq.answer }} />
          </Accordion>
        ))}
      </div>
      <CompareSolutionsButton />
    </Section>
  );
}
