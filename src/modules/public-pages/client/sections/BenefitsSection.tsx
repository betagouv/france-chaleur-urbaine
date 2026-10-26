import Image from 'next/image';

import Section, { type SectionProps } from '@/components/ui/Section';

import { BENEFITS } from '../../constants';
import { CardFrame } from '../ui/CardFrame';
import { SectionIntro } from '../ui/SectionIntro';

type BenefitsSectionProps = Pick<SectionProps, 'variant'>;

/**
 * "Pourquoi choisir un chauffage écologique" section: the six benefit cards.
 */
export function BenefitsSection({ variant }: BenefitsSectionProps) {
  return (
    <Section variant={variant}>
      <SectionIntro eyebrow="Pourquoi choisir un chauffage écologique" title="Des arguments concrets, bien au-delà de l’environnement" />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {BENEFITS.map((benefit) => (
          <BenefitCard key={benefit.title} {...benefit} />
        ))}
      </div>
    </Section>
  );
}

type BenefitCardProps = (typeof BENEFITS)[number];

function BenefitCard({ icon, title, description }: BenefitCardProps) {
  return (
    <CardFrame className="h-full">
      <h3 className="fr-h4">
        <Image src={`/icons/${icon}`} width="24" height="24" alt="" className="mr-3 mb-1 inline-block" />
        {title}
      </h3>
      <p className="mb-0">{description}</p>
    </CardFrame>
  );
}
