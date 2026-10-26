import Image from 'next/image';

import Section, { type SectionProps } from '@/components/ui/Section';

import { CompareSolutionsButton } from '../ui/CompareSolutionsButton';
import { SectionIntro } from '../ui/SectionIntro';

type SolutionsIllustrationSectionProps = Pick<SectionProps, 'variant'>;

/**
 * "Quelles solutions concrètes pour votre copropriété ?" section: the collective building
 * illustration with every renewable heating option, followed by the compare CTA.
 */
export function SolutionsIllustrationSection({ variant }: SolutionsIllustrationSectionProps) {
  return (
    <Section variant={variant}>
      <SectionIntro eyebrow="Les différentes énergies renouvelables (ENR)" title="Quelles solutions concrètes pour votre copropriété ?">
        Le réseau de chaleur est à privilégier quand il passe près de chez vous. Sinon, d’autres solutions renouvelables existent : notre
        simulateur les compare pour votre bâtiment.
      </SectionIntro>
      <Image
        src="/img/different-mode-chauffage.webp"
        alt="Illustration des différents modes de chauffage écologiques d’un immeuble en chauffage collectif"
        className="mt-8 w-full"
        width={1600}
        height={750}
      />
      <CompareSolutionsButton />
    </Section>
  );
}
