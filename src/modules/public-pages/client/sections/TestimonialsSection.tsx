import Carousel from '@/components/ui/Carousel';
import Link from '@/components/ui/Link';
import Section, { type SectionProps } from '@/components/ui/Section';

import { TESTIMONIALS } from '../../constants';
import { usePublicPage } from '../PublicPageContext';
import { CardFrame } from '../ui/CardFrame';
import { CardImage } from '../ui/CardImage';
import { SectionIntro } from '../ui/SectionIntro';

type TestimonialsSectionProps = Pick<SectionProps, 'variant'>;

/**
 * "Témoignages" section: a carousel of co-ownerships that switched to renewable heating.
 */
export function TestimonialsSection({ variant }: TestimonialsSectionProps) {
  const { source } = usePublicPage();

  return (
    <Section variant={variant} size="compact">
      <SectionIntro eyebrow="Témoignages" title="Ces copropriétés ont fait l’expérience de l’ENR" />
      <Carousel
        items={TESTIMONIALS}
        getItemKey={(testimonial) => testimonial.title}
        previousLabel="Voir le témoignage précédent"
        nextLabel="Voir le témoignage suivant"
        renderItem={(testimonial) => (
          <CardFrame className="flex h-full flex-col">
            <CardImage src={`/img/${testimonial.image}`} alt="" />
            <h3 className="fr-h4">{testimonial.title}</h3>
            <p className="mb-2">Type de chauffage : collectif</p>
            <p className="mb-2">Année de construction : {testimonial.year}</p>
            <p className="mb-2">Nombre de logements : {testimonial.nbLogement}</p>
            <Link
              postHogEventKey={`${source}:testimonial_clicked`}
              postHogEventProps={{ element_name: testimonial.title, testimonial_title: testimonial.title }}
              variant="secondary"
              className="mt-6"
              href={testimonial.link}
              isExternal
            >
              Lire le témoignage
            </Link>
          </CardFrame>
        )}
      />
    </Section>
  );
}
